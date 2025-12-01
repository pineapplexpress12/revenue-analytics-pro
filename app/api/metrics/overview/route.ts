import { NextRequest, NextResponse } from "next/server";
import { calculateMRR, calculateMRRGrowth } from "@/lib/metrics/mrr";
import { calculateTotalRevenue, calculateARPU } from "@/lib/metrics/revenue";
import { calculateChurnRate } from "@/lib/metrics/churn";
import { calculateLTV } from "@/lib/metrics/ltv";
import { db } from "@/lib/db";
import { memberships, companies } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCachedMetric, setCachedMetric } from "@/lib/metrics-cache";
import { startOfDay, endOfDay } from "date-fns";

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

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const cached = await getCachedMetric(
      companyId,
      "overview",
      startOfDay(now),
      endOfDay(now)
    );

    if (cached && cached.metadata) {
      return NextResponse.json(cached.metadata);
    }

    const mrr = await calculateMRR(companyId);
    const mrrGrowth = await calculateMRRGrowth(companyId, now, lastMonth);
    
    const totalRevenue = await calculateTotalRevenue(companyId);
    
    // Count active members - include trialing as they are valid active members
    const activeMembershipsResult = await db
      .select({ memberId: memberships.memberId })
      .from(memberships)
      .where(
        and(
          eq(memberships.companyId, companyId),
          sql`${memberships.status} IN ('active', 'completed', 'trialing')`
        )
      )
      .groupBy(memberships.memberId);

    const activeMembersCount = activeMembershipsResult.length;

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const previousMonthActiveMembers = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.companyId, companyId),
          sql`${memberships.status} IN ('active', 'completed', 'trialing')`
        )
      );

    const previousActiveMemberIds = new Set<string>();
    const lastMonthTime = lastMonth.getTime();

    for (const membership of previousMonthActiveMembers) {
      const startTime = new Date(membership.startDate).getTime();
      const endTime = membership.endDate ? new Date(membership.endDate).getTime() : Date.now();
      
      if (startTime <= lastMonthTime && endTime >= lastMonthTime) {
        previousActiveMemberIds.add(membership.memberId);
      }
    }

    const previousActiveCount = previousActiveMemberIds.size;

    const memberGrowth = previousActiveCount > 0 
      ? Math.round(((activeMembersCount - previousActiveCount) / previousActiveCount) * 100 * 10) / 10
      : activeMembersCount > 0 ? 100 : 0;

    const currentChurnRate = await calculateChurnRate(companyId, lastMonth, now);
    const previousChurnRate = await calculateChurnRate(companyId, twoMonthsAgo, lastMonth);
    
    const churnChange = previousChurnRate > 0
      ? Math.round(((currentChurnRate - previousChurnRate) / previousChurnRate) * 100 * 10) / 10
      : 0;

    const ltv = await calculateLTV(companyId);
    const arpu = await calculateARPU(companyId);

    const metrics = {
      mrr: Math.round(mrr * 100) / 100,
      mrrGrowth: Math.round(mrrGrowth * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeMembers: activeMembersCount,
      memberGrowth: memberGrowth,
      churnRate: Math.round(currentChurnRate * 10) / 10,
      churnChange: churnChange,
      ltv: Math.round(ltv * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
    };

    await setCachedMetric(
      companyId,
      "overview",
      null,
      metrics,
      startOfDay(now),
      endOfDay(now)
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
