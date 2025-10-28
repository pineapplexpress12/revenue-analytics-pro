import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  companies,
  products,
  plans,
  members,
  memberships,
  payments,
  syncLogs,
} from "@/lib/db/schema";
import {
  fetchMembershipsSince,
  fetchPaymentsSince,
} from "@/lib/whop-fetchers";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const allCompanies = await db.select().from(companies);

    const results = [];

    for (const company of allCompanies) {
      const startedAt = new Date();
      
      try {
        const lastSync = company.updatedAt || company.createdAt;

        const logSync = async (
          entityType: string,
          status: string,
          recordsProcessed: number,
          errorMessage?: string
        ) => {
          await db.insert(syncLogs).values({
            companyId: company.id,
            syncType: "incremental",
            entityType,
            status,
            recordsProcessed,
            errorMessage,
            startedAt,
            completedAt: new Date(),
          });
        };

        const whopMemberships = await fetchMembershipsSince(
          company.whopCompanyId,
          lastSync
        );

        for (const membership of whopMemberships) {
          const userId = membership.user?.id;
          const planId = membership.plan?.id;
          
          if (!userId || !planId) continue;
          
          const dbMember = await db
            .select()
            .from(members)
            .where(eq(members.whopUserId, userId))
            .limit(1);

          const dbPlan = await db
            .select()
            .from(plans)
            .where(eq(plans.whopPlanId, planId))
            .limit(1);
          
          if (!dbPlan[0]) continue;
          
          const dbProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, dbPlan[0].productId))
            .limit(1);

          if (dbMember[0] && dbProduct[0]) {
            await db
              .insert(memberships)
              .values({
                companyId: company.id,
                memberId: dbMember[0].id,
                productId: dbProduct[0].id,
                planId: dbPlan[0].id,
                whopMembershipId: membership.id,
                status: membership.status,
                startDate: new Date(Number(membership.created_at) * 1000),
                endDate: membership.renewal_period_end
                  ? new Date(Number(membership.renewal_period_end) * 1000)
                  : null,
                metadata: membership,
              })
              .onConflictDoUpdate({
                target: memberships.whopMembershipId,
                set: {
                  status: membership.status,
                  endDate: membership.renewal_period_end
                    ? new Date(Number(membership.renewal_period_end) * 1000)
                    : null,
                  metadata: membership,
                },
              });
          }
        }
        await logSync("memberships", "completed", whopMemberships.length);

        const whopPayments = await fetchPaymentsSince(
          company.whopCompanyId,
          lastSync
        );

        for (const payment of whopPayments) {
          const userId = payment.user?.id;
          if (!userId) continue;
          
          const dbMember = await db
            .select()
            .from(members)
            .where(eq(members.whopUserId, userId))
            .limit(1);

          if (dbMember[0]) {
            await db
              .insert(payments)
              .values({
                companyId: company.id,
                memberId: dbMember[0].id,
                whopPaymentId: payment.id,
                amount: String(Number(payment.subtotal) / 100),
                currency: payment.currency || "usd",
                status: payment.status || "succeeded",
                paymentDate: new Date(Number(payment.created_at) * 1000),
                metadata: payment,
              })
              .onConflictDoUpdate({
                target: payments.whopPaymentId,
                set: {
                  status: payment.status || "succeeded",
                  metadata: payment,
                },
              });
          }
        }
        await logSync("payments", "completed", whopPayments.length);

        await db
          .update(companies)
          .set({ updatedAt: new Date() })
          .where(eq(companies.id, company.id));

        results.push({
          companyId: company.whopCompanyId,
          success: true,
          synced: {
            memberships: whopMemberships.length,
            payments: whopPayments.length,
          },
        });
      } catch (error) {
        console.error(`Sync failed for ${company.whopCompanyId}:`, error);
        
        await db.insert(syncLogs).values({
          companyId: company.id,
          syncType: "incremental",
          entityType: "all",
          status: "failed",
          recordsProcessed: 0,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          startedAt,
          completedAt: new Date(),
        });

        results.push({
          companyId: company.whopCompanyId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalCompanies: allCompanies.length,
    });
  } catch (error) {
    console.error("Incremental sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
