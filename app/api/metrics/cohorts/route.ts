import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberships, companies } from "@/lib/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { startOfMonth, addMonths, format, differenceInMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const whopCompanyId = searchParams.get("companyId");
    const cohorts = parseInt(searchParams.get("cohorts") || "6");

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

    const endDate = new Date();
    const cohortData = [];

    for (let i = 0; i < cohorts; i++) {
      const cohortMonth = startOfMonth(addMonths(endDate, -cohorts + i + 1));
      const cohortEnd = addMonths(cohortMonth, 1);

      const cohortMembers = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.companyId, companyId),
            gte(memberships.startDate, cohortMonth),
            lte(memberships.startDate, cohortEnd)
          )
        );

      const cohortSize = cohortMembers.length;
      
      if (cohortSize === 0) continue;

      const retention = {
        month0: 100,
        month1: -1,
        month2: -1,
        month3: -1,
        month4: -1,
        month5: -1,
      };

      for (let monthOffset = 1; monthOffset <= 5; monthOffset++) {
        const checkDate = addMonths(cohortMonth, monthOffset);
        
        if (checkDate > endDate) {
          break;
        }

        const activeMembers = cohortMembers.filter((membership) => {
          const membershipActive = membership.status === "active" || 
            (membership.endDate && new Date(membership.endDate) >= checkDate);
          
          return membershipActive;
        });

        const retentionRate = (activeMembers.length / cohortSize) * 100;
        
        switch (monthOffset) {
          case 1:
            retention.month1 = retentionRate;
            break;
          case 2:
            retention.month2 = retentionRate;
            break;
          case 3:
            retention.month3 = retentionRate;
            break;
          case 4:
            retention.month4 = retentionRate;
            break;
          case 5:
            retention.month5 = retentionRate;
            break;
        }
      }

      cohortData.push({
        cohort: format(cohortMonth, "MMM yyyy"),
        size: cohortSize,
        retention,
      });
    }

    return NextResponse.json({
      success: true,
      data: cohortData,
    });
  } catch (error) {
    console.error("Error fetching cohort analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohort analysis" },
      { status: 500 }
    );
  }
}
