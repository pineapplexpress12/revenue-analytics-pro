import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, plans, memberships, payments, companies } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const whopCompanyId = searchParams.get("companyId");

    if (!whopCompanyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.whopCompanyId, whopCompanyId))
      .limit(1);

    if (!company[0]) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const companyId = company[0].id;

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.companyId, companyId));

    const productMetrics = await Promise.all(
      allProducts.map(async (product) => {
        const productPlans = await db
          .select()
          .from(plans)
          .where(eq(plans.productId, product.id));

        const planIds = productPlans.map((p) => p.id);

        const activeMemberships = planIds.length > 0
          ? await db
              .select({ count: sql<number>`count(*)` })
              .from(memberships)
              .where(
                and(
                  eq(memberships.companyId, companyId),
                  eq(memberships.status, "active"),
                  sql`${memberships.planId} IN ${planIds}`
                )
              )
          : [{ count: 0 }];

        const totalMemberships = planIds.length > 0
          ? await db
              .select({ count: sql<number>`count(*)` })
              .from(memberships)
              .where(
                and(
                  eq(memberships.companyId, companyId),
                  sql`${memberships.planId} IN ${planIds}`
                )
              )
          : [{ count: 0 }];

        const churnedMemberships = planIds.length > 0
          ? await db
              .select({ count: sql<number>`count(*)` })
              .from(memberships)
              .where(
                and(
                  eq(memberships.companyId, companyId),
                  eq(memberships.status, "cancelled"),
                  sql`${memberships.planId} IN ${planIds}`
                )
              )
          : [{ count: 0 }];

        const productRevenue = planIds.length > 0
          ? await db
              .select({ 
                total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)` 
              })
              .from(payments)
              .innerJoin(memberships, eq(payments.memberId, memberships.memberId))
              .where(
                and(
                  eq(payments.companyId, companyId),
                  eq(payments.status, "succeeded"),
                  sql`${memberships.planId} IN ${planIds}`
                )
              )
          : [{ total: 0 }];

        let mrr = 0;
        for (const plan of productPlans) {
          const planMemberships = await db
            .select({ count: sql<number>`count(*)` })
            .from(memberships)
            .where(
              and(
                eq(memberships.companyId, companyId),
                eq(memberships.planId, plan.id),
                eq(memberships.status, "active")
              )
            );

          const memberCount = Number(planMemberships[0]?.count || 0);
          const price = parseFloat(plan.price);

          if (plan.billingPeriod === "monthly" || plan.billingPeriod === "month") {
            mrr += price * memberCount;
          } else if (plan.billingPeriod === "yearly" || plan.billingPeriod === "year") {
            mrr += (price / 12) * memberCount;
          } else if (typeof plan.billingPeriod === 'string' && plan.billingPeriod.match(/^\d+$/)) {
            const days = parseInt(plan.billingPeriod);
            mrr += (price / (days / 30)) * memberCount;
          }
        }

        const activeCount = Number(activeMemberships[0]?.count || 0);
        const totalCount = Number(totalMemberships[0]?.count || 0);
        const churnedCount = Number(churnedMemberships[0]?.count || 0);

        const churnRate = totalCount > 0 ? (churnedCount / totalCount) * 100 : 0;

        return {
          id: product.whopProductId,
          name: product.name,
          revenue: Number(productRevenue[0]?.total || 0),
          mrr: Math.round(mrr * 100) / 100,
          activeMembers: activeCount,
          totalMembers: totalCount,
          churnRate: Math.round(churnRate * 10) / 10,
          plans: productPlans.length,
        };
      })
    );

    productMetrics.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: productMetrics,
    });
  } catch (error) {
    console.error("Error fetching product metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch product metrics" },
      { status: 500 }
    );
  }
}
