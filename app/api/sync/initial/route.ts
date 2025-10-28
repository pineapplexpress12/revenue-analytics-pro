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
  fetchAllMemberships,
  fetchAllPayments,
  fetchAllProducts,
  fetchAllMembers,
} from "@/lib/whop-fetchers";
import { whopsdk } from "@/lib/whop-sdk";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  let companyId: string | null = null;
  let dbCompanyId: string | null = null;

  try {
    const body = await request.json();
    companyId = body.companyId;
    const companyName = body.companyName || "Unknown Company";

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.whopCompanyId, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      const [newCompany] = await db
        .insert(companies)
        .values({
          whopCompanyId: companyId,
          name: companyName,
        })
        .returning();
      dbCompanyId = newCompany.id;
    } else {
      dbCompanyId = existingCompany[0].id;
    }

    const logSync = async (
      entityType: string,
      status: string,
      recordsProcessed: number,
      errorMessage?: string
    ) => {
      await db.insert(syncLogs).values({
        companyId: dbCompanyId,
        syncType: "full",
        entityType,
        status,
        recordsProcessed,
        errorMessage,
        startedAt,
        completedAt: new Date(),
      });
    };

    const whopProducts = await fetchAllProducts(companyId);
    for (const product of whopProducts) {
      await db
        .insert(products)
        .values({
          companyId: dbCompanyId,
          whopProductId: product.id,
          name: product.title,
          description: product.description,
          metadata: product,
        })
        .onConflictDoUpdate({
          target: products.whopProductId,
          set: {
            name: product.title,
            description: product.description,
            metadata: product,
          },
        });
    }
    await logSync("products", "completed", whopProducts.length);

    const whopPlans = [];
    for await (const plan of whopsdk.plans.list({ company_id: companyId })) {
      whopPlans.push(plan);
    }
    
    for (const plan of whopPlans) {
      if (!plan.product?.id) continue;
      
      const dbProduct = await db
        .select()
        .from(products)
        .where(eq(products.whopProductId, plan.product.id))
        .limit(1);
      
      if (!dbProduct[0]) continue;
      
      await db
        .insert(plans)
        .values({
          productId: dbProduct[0].id,
          whopPlanId: plan.id,
          name: plan.description || "Default Plan",
          price: String(plan.initial_price || 0),
          currency: plan.currency || "usd",
          billingPeriod: plan.billing_period ? String(plan.billing_period) : "monthly",
          metadata: plan,
        })
        .onConflictDoUpdate({
          target: plans.whopPlanId,
          set: {
            name: plan.description || "Default Plan",
            price: String(plan.initial_price || 0),
            metadata: plan,
          },
        });
    }
    await logSync("plans", "completed", whopPlans.length);

    const whopMembers = await fetchAllMembers(companyId);
    for (const member of whopMembers) {
      if (!member.user?.id) continue;
      
      await db
        .insert(members)
        .values({
          companyId: dbCompanyId,
          whopUserId: member.user.id,
          email: "",
          username: member.user.username || "",
          metadata: member,
        })
        .onConflictDoUpdate({
          target: members.whopUserId,
          set: {
            username: member.user.username || "",
            metadata: member,
          },
        });
    }
    await logSync("members", "completed", whopMembers.length);

    const whopMemberships = await fetchAllMemberships(companyId);
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
            companyId: dbCompanyId,
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

    const whopPayments = await fetchAllPayments(companyId);
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
            companyId: dbCompanyId,
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
      .where(eq(companies.id, dbCompanyId));

    return NextResponse.json({
      success: true,
      synced: {
        products: whopProducts.length,
        members: whopMembers.length,
        memberships: whopMemberships.length,
        payments: whopPayments.length,
      },
    });
  } catch (error) {
    console.error("Initial sync failed:", error);
    
    if (dbCompanyId) {
      await db.insert(syncLogs).values({
        companyId: dbCompanyId,
        syncType: "full",
        entityType: "all",
        status: "failed",
        recordsProcessed: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        startedAt,
        completedAt: new Date(),
      });
    }

    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
