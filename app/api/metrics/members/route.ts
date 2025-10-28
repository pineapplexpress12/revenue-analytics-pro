import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberships } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const allMemberships = await db
      .select()
      .from(memberships)
      .where(eq(memberships.companyId, companyId));

    const active = allMemberships.filter(m => m.status === "active").length;
    const churned = allMemberships.filter(m => 
      m.status === "cancelled" || m.status === "expired"
    ).length;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const newThisMonth = allMemberships.filter(
      m => new Date(m.startDate) >= thisMonthStart
    ).length;

    const timeline = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const countAtMonth = allMemberships.filter(m => {
        const start = new Date(m.startDate);
        const end = m.endDate ? new Date(m.endDate) : now;
        return start <= monthEnd && end >= monthStart;
      }).length;

      const newInMonth = allMemberships.filter(m => {
        const start = new Date(m.startDate);
        return start >= monthStart && start < monthEnd;
      }).length;

      const churnedInMonth = allMemberships.filter(m => {
        if (!m.endDate) return false;
        const end = new Date(m.endDate);
        return end >= monthStart && end < monthEnd;
      }).length;

      timeline.push({
        date: format(monthDate, "MMM yyyy"),
        count: countAtMonth,
        new: newInMonth,
        churned: churnedInMonth,
      });
    }

    return NextResponse.json({
      total: allMemberships.length,
      active,
      churned,
      newThisMonth,
      timeline,
    });
  } catch (error) {
    console.error("Error fetching member metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch member metrics" },
      { status: 500 }
    );
  }
}
