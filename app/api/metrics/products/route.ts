import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, plans, memberships, payments, companies } from "@/lib/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

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
      .where(
        and(
          eq(products.companyId, companyId),
          eq(products.isApp, false)
        )
      );

    const productMetrics = await Promise.all(
      allProducts.map(async (product) => {
        const productPlans = await db
          .select()
          .from(plans)
          .where(eq(plans.productId, product.id));

        const planIds = productPlans.map((p) => p.id);

        if (planIds.length === 0) {
          return {
            id: product.whopProductId,
            name: product.name,
            revenue: 0,
            mrr: 0,
            activeMembers: 0,
            totalMembers: 0,
            churnRate: 0,
            plans: 0,
          };
        }

        const activeMemberships = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(memberships)
          .where(
            and(
              eq(memberships.companyId, companyId),
              eq(memberships.status, "active"),
              inArray(memberships.planId, planIds)
            )
          );

        const totalMemberships = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(memberships)
          .where(
            and(
              eq(memberships.companyId, companyId),
              inArray(memberships.planId, planIds)
            )
          );

        const churnedMemberships = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(memberships)
          .where(
            and(
              eq(memberships.companyId, companyId),
              eq(memberships.status, "cancelled"),
              inArray(memberships.planId, planIds)
            )
          );

        const productRevenue = await db
          .select({ 
            total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)` 
          })
          .from(payments)
          .leftJoin(memberships, eq(payments.membershipId, memberships.id))
          .where(
            and(
              eq(payments.companyId, companyId),
              eq(payments.status, "succeeded"),
              inArray(memberships.planId, planIds)
            )
          );

        const activeMembershipsByPlan = await db
          .select({
            planId: memberships.planId,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(memberships)
          .where(
            and(
              eq(memberships.companyId, companyId),
              eq(memberships.status, "active"),
              inArray(memberships.planId, planIds)
            )
          )
          .groupBy(memberships.planId);

        const membershipCountMap = new Map(
          activeMembershipsByPlan.map(m => [m.planId, Number(m.count)])
        );

        let mrr = 0;
        for (const plan of productPlans) {
          const memberCount = membershipCountMap.get(plan.id) || 0;
          const price = parseFloat(plan.price);

          const billingPeriod = plan.billingPeriod;
          
          if (billingPeriod === "monthly" || billingPeriod === "month" || billingPeriod === "30") {
            mrr += price * memberCount;
          } else if (billingPeriod === "yearly" || billingPeriod === "year" || billingPeriod === "365") {
            mrr += (price / 12) * memberCount;
          } else if (billingPeriod === "weekly" || billingPeriod === "week" || billingPeriod === "7") {
            mrr += (price * 4.33) * memberCount;
          } else if (billingPeriod === "daily" || billingPeriod === "day" || billingPeriod === "1") {
            mrr += (price * 30) * memberCount;
          } else if (typeof billingPeriod === 'string' && billingPeriod.match(/^\d+$/)) {
            const days = parseInt(billingPeriod);
            if (days > 0) {
              mrr += (price * 30 / days) * memberCount;
            }
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
