import { NextRequest, NextResponse } from "next/server";
import { getRevenueTimeSeries, calculateRevenueGrowth } from "@/lib/metrics/revenue";
import { calculateMRR } from "@/lib/metrics/mrr";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const whopCompanyId = searchParams.get("companyId");
    const period = searchParams.get("period") || "month";

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
    const startDate = new Date();
    
    if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    const timeSeriesData = await getRevenueTimeSeries(
      companyId,
      startDate,
      now,
      period === "year" ? "month" : "month"
    );

    const currentMRR = await calculateMRR(companyId);
    
    const dataWithMRR = timeSeriesData.map(item => ({
      ...item,
      mrr: currentMRR,
    }));

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const growth = await calculateRevenueGrowth(
      companyId,
      lastMonth,
      now,
      twoMonthsAgo,
      lastMonth
    );

    return NextResponse.json({
      data: dataWithMRR,
      growth: Math.round(growth * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue metrics" },
      { status: 500 }
    );
  }
}
