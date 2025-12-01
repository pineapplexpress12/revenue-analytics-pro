import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberships, companies } from "@/lib/db/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { startOfMonth, subMonths, format, addMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const whopCompanyId = searchParams.get("companyId");
    const months = parseInt(searchParams.get("months") || "12");

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
    const monthlyData = [];

    // Include all membership statuses for accurate growth tracking
    const allMemberships = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.companyId, companyId),
          sql`${memberships.status} IN ('active', 'completed', 'trialing', 'canceled', 'expired', 'past_due')`
        )
      );

    const memberFirstSubscription = new Map<string, number>();
    for (const membership of allMemberships) {
      const startTime = new Date(membership.startDate).getTime();
      const existing = memberFirstSubscription.get(membership.memberId);
      if (!existing || startTime < existing) {
        memberFirstSubscription.set(membership.memberId, startTime);
      }
    }

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = addMonths(monthStart, 1);
      const monthEndTime = monthEnd.getTime();
      const monthStartTime = monthStart.getTime();

      const activeMemberIds = new Set<string>();
      const newMemberIds = new Set<string>();
      const churnedMemberIds = new Set<string>();

      for (const membership of allMemberships) {
        const startTime = new Date(membership.startDate).getTime();
        const endTime = membership.endDate ? new Date(membership.endDate).getTime() : Date.now();
        
        if (startTime < monthEndTime && endTime >= monthStartTime) {
          activeMemberIds.add(membership.memberId);
        }
      }

      for (const [memberId, firstSubTime] of memberFirstSubscription.entries()) {
        if (firstSubTime >= monthStartTime && firstSubTime < monthEndTime) {
          newMemberIds.add(memberId);
        }
      }

      for (const membership of allMemberships) {
        if (membership.endDate && membership.status === "canceled") {
          const cancelTime = new Date(membership.endDate).getTime();
          if (cancelTime >= monthStartTime && cancelTime < monthEndTime) {
            const hasActiveAfter = allMemberships.some(m => 
              m.memberId === membership.memberId && 
              new Date(m.startDate).getTime() > cancelTime &&
              m.status === 'active'
            );
            if (!hasActiveAfter) {
              churnedMemberIds.add(membership.memberId);
            }
          }
        }
      }

      monthlyData.push({
        date: format(monthStart, "MMM yyyy"),
        members: activeMemberIds.size,
        newMembers: newMemberIds.size,
        churnedMembers: churnedMemberIds.size,
      });
    }

    return NextResponse.json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching member growth:", error);
    return NextResponse.json(
      { error: "Failed to fetch member growth" },
      { status: 500 }
    );
  }
}
