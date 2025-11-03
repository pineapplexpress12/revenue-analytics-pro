import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberships, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";

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

    const allMemberships = await db
      .select()
      .from(memberships)
      .where(eq(memberships.companyId, companyId));

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
      const monthEndTime = monthEnd.getTime();
      const monthStartTime = monthStart.getTime();

      const activeMemberIds = new Set<string>();
      const newMemberIds = new Set<string>();
      const churnedMemberIds = new Set<string>();

      for (const membership of allMemberships) {
        const startTime = new Date(membership.startDate).getTime();
        const endTime = membership.endDate ? new Date(membership.endDate).getTime() : Date.now();
        
        if (startTime <= monthEndTime && endTime >= monthEndTime) {
          activeMemberIds.add(membership.memberId);
        }
        
        if (startTime >= monthStartTime && startTime <= monthEndTime) {
          newMemberIds.add(membership.memberId);
        }
        
        if (membership.endDate) {
          const cancelTime = new Date(membership.endDate).getTime();
          if (cancelTime >= monthStartTime && cancelTime <= monthEndTime) {
            churnedMemberIds.add(membership.memberId);
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
