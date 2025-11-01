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
import { invalidateMetricCache } from "@/lib/metrics-cache";

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
      const productData = product as any;
      const isApp = !!(productData.experiences && Array.isArray(productData.experiences) && productData.experiences.length > 0);
      
      await db
        .insert(products)
        .values({
          companyId: dbCompanyId,
          whopProductId: product.id,
          name: product.title,
          description: product.description,
          isApp: isApp,
          metadata: product,
        })
        .onConflictDoUpdate({
          target: products.whopProductId,
          set: {
            name: product.title,
            description: product.description,
            isApp: isApp,
            metadata: product,
          },
        });
    }
    await logSync("products", "completed", whopProducts.length);

    const whopPlans = [];
    for await (const plan of whopsdk.plans.list({ company_id: companyId })) {
      whopPlans.push(plan);
    }
    
    const dbProducts = await db
      .select()
      .from(products)
      .where(eq(products.companyId, dbCompanyId));
    
    const productMap = new Map(dbProducts.map(p => [p.whopProductId, p.id]));
    
    for (const plan of whopPlans) {
      if (!plan.product?.id) continue;
      
      const productId = productMap.get(plan.product.id);
      if (!productId) continue;
      
      await db
        .insert(plans)
        .values({
          productId: productId,
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
      
      let memberCreatedAt = new Date();
      if (member.created_at) {
        const timestamp = Number(member.created_at);
        if (!isNaN(timestamp) && timestamp > 0) {
          const date = new Date(timestamp * 1000);
          if (!isNaN(date.getTime())) {
            memberCreatedAt = date;
          }
        }
      }
      
      await db
        .insert(members)
        .values({
          companyId: dbCompanyId,
          whopUserId: member.user.id,
          email: "",
          username: member.user.username || "",
          metadata: member,
          createdAt: memberCreatedAt,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: members.whopUserId,
          set: {
            username: member.user.username || "",
            metadata: member,
            updatedAt: new Date(),
          },
        });
    }
    await logSync("members", "completed", whopMembers.length);

    const whopMemberships = await fetchAllMemberships(companyId);
    
    const dbMembers = await db
      .select()
      .from(members)
      .where(eq(members.companyId, dbCompanyId));
    
    const dbPlans = await db
      .select()
      .from(plans)
      .innerJoin(products, eq(products.id, plans.productId))
      .where(eq(products.companyId, dbCompanyId));
    
    const memberMap = new Map(dbMembers.map(m => [m.whopUserId, m.id]));
    const planMap = new Map(dbPlans.map(p => [p.plans.whopPlanId, { planId: p.plans.id, productId: p.plans.productId }]));
    
    for (const membership of whopMemberships) {
      const userId = membership.user?.id;
      const planId = membership.plan?.id;
      
      if (!userId || !planId) continue;
      
      const memberId = memberMap.get(userId);
      const planInfo = planMap.get(planId);
      
      if (!memberId || !planInfo) continue;

      const startTimestamp = Number(membership.created_at);
      const startDate = !isNaN(startTimestamp) && startTimestamp > 0 
        ? new Date(startTimestamp * 1000) 
        : new Date();
      
      let endDate = null;
      if (membership.renewal_period_end) {
        const endTimestamp = Number(membership.renewal_period_end);
        if (!isNaN(endTimestamp) && endTimestamp > 0) {
          const date = new Date(endTimestamp * 1000);
          if (!isNaN(date.getTime())) {
            endDate = date;
          }
        }
      }

      await db
        .insert(memberships)
        .values({
          companyId: dbCompanyId,
          memberId: memberId,
          productId: planInfo.productId,
          planId: planInfo.planId,
          whopMembershipId: membership.id,
          status: membership.status,
          startDate: startDate,
          endDate: endDate,
          metadata: membership,
        })
        .onConflictDoUpdate({
          target: memberships.whopMembershipId,
          set: {
            status: membership.status,
            endDate: endDate,
            metadata: membership,
          },
        });
    }
    await logSync("memberships", "completed", whopMemberships.length);

    const whopPayments = await fetchAllPayments(companyId);
    
    for (const payment of whopPayments) {
      const userId = payment.user?.id;
      if (!userId) continue;
      
      const memberId = memberMap.get(userId);
      if (!memberId) continue;

      const paymentTimestamp = Number(payment.created_at);
      const paymentDate = !isNaN(paymentTimestamp) && paymentTimestamp > 0
        ? new Date(paymentTimestamp * 1000)
        : new Date();

      await db
        .insert(payments)
        .values({
          companyId: dbCompanyId,
          memberId: memberId,
          whopPaymentId: payment.id,
          amount: String(Number(payment.subtotal) / 100),
          currency: payment.currency || "usd",
          status: payment.status || "succeeded",
          paymentDate: paymentDate,
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
    await logSync("payments", "completed", whopPayments.length);

    await db
      .update(companies)
      .set({ updatedAt: new Date() })
      .where(eq(companies.id, dbCompanyId));

    await invalidateMetricCache(dbCompanyId);

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
