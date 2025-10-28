import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberships, companies } from "@/lib/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
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

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = i === 0 ? now : startOfMonth(subMonths(now, i - 1));

      const totalMembers = await db
        .select({ count: sql<number>`count(*)` })
        .from(memberships)
        .where(
          and(
            eq(memberships.companyId, companyId),
            eq(memberships.status, "active"),
            lte(memberships.startDate, monthEnd)
          )
        );

      const newMembers = await db
        .select({ count: sql<number>`count(*)` })
        .from(memberships)
        .where(
          and(
            eq(memberships.companyId, companyId),
            gte(memberships.startDate, monthStart),
            lte(memberships.startDate, monthEnd)
          )
        );

      const churnedMembers = await db
        .select({ count: sql<number>`count(*)` })
        .from(memberships)
        .where(
          and(
            eq(memberships.companyId, companyId),
            eq(memberships.status, "cancelled"),
            gte(memberships.endDate, monthStart),
            lte(memberships.endDate, monthEnd)
          )
        );

      monthlyData.push({
        date: format(monthStart, "MMM yyyy"),
        members: Number(totalMembers[0]?.count || 0),
        newMembers: Number(newMembers[0]?.count || 0),
        churnedMembers: Number(churnedMembers[0]?.count || 0),
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
