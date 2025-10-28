import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  companies,
  products,
  plans,
  members,
  memberships,
  payments,
  memberAnalytics,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyId = body.companyId;

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
      return NextResponse.json(
        { error: "Company not found. Run initial sync first." },
        { status: 404 }
      );
    }

    const dbCompanyId = existingCompany[0].id;

    const testProduct = await db
      .insert(products)
      .values({
        companyId: dbCompanyId,
        whopProductId: `test_prod_${createId()}`,
        name: "Premium Community Access",
        description: "Full access to premium content",
        metadata: {},
      })
      .onConflictDoNothing()
      .returning();

    const productId = testProduct[0]?.id || (await db.select().from(products).where(eq(products.companyId, dbCompanyId)).limit(1))[0].id;

    const testPlan = await db
      .insert(plans)
      .values({
        productId: productId,
        whopPlanId: `test_plan_${createId()}`,
        name: "Monthly Subscription",
        price: "49",
        currency: "usd",
        billingPeriod: "monthly",
        metadata: {},
      })
      .onConflictDoNothing()
      .returning();

    const planId = testPlan[0]?.id || (await db.select().from(plans).where(eq(plans.productId, productId)).limit(1))[0].id;

    const testMembers = [];
    const names = [
      { first: "John", last: "Doe", email: "john.doe@example.com" },
      { first: "Jane", last: "Smith", email: "jane.smith@example.com" },
      { first: "Mike", last: "Johnson", email: "mike.j@example.com" },
      { first: "Sarah", last: "Williams", email: "sarah.w@example.com" },
      { first: "David", last: "Brown", email: "david.b@example.com" },
      { first: "Emily", last: "Davis", email: "emily.d@example.com" },
      { first: "Chris", last: "Miller", email: "chris.m@example.com" },
      { first: "Lisa", last: "Wilson", email: "lisa.w@example.com" },
      { first: "Tom", last: "Moore", email: "tom.moore@example.com" },
      { first: "Anna", last: "Taylor", email: "anna.t@example.com" },
    ];

    for (const name of names) {
      const [member] = await db
        .insert(members)
        .values({
          companyId: dbCompanyId,
          whopUserId: `test_user_${createId()}`,
          email: name.email,
          username: `${name.first.toLowerCase()}${name.last.toLowerCase()}`,
          metadata: { profile_pic_url: `https://ui-avatars.com/api/?name=${name.first}+${name.last}` },
        })
        .returning();

      testMembers.push(member);
    }

    const now = new Date();
    const testMemberships = [];
    const testPayments = [];

    for (let i = 0; i < testMembers.length; i++) {
      const member = testMembers[i];
      const monthsAgo = Math.floor(Math.random() * 12) + 1;
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - monthsAgo);

      const isActive = Math.random() > 0.2;
      const status = isActive ? "active" : "cancelled";

      const [membership] = await db
        .insert(memberships)
        .values({
          companyId: dbCompanyId,
          memberId: member.id,
          productId: productId,
          planId: planId,
          whopMembershipId: `test_membership_${createId()}`,
          status: status,
          startDate: startDate,
          endDate: isActive ? null : new Date(),
          metadata: {},
        })
        .returning();

      testMemberships.push(membership);

      const paymentCount = Math.floor(Math.random() * monthsAgo) + 1;
      let totalRevenue = 0;
      let successfulPayments = 0;
      let failedPaymentsCount = 0;

      for (let j = 0; j < paymentCount; j++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + j);

        const shouldFail = Math.random() > 0.85;
        const paymentStatus = shouldFail ? "failed" : "succeeded";

        if (shouldFail) {
          failedPaymentsCount++;
        } else {
          totalRevenue += 49;
          successfulPayments++;
        }

        await db.insert(payments).values({
          companyId: dbCompanyId,
          memberId: member.id,
          whopPaymentId: `test_payment_${createId()}`,
          amount: "49.00",
          currency: "usd",
          status: paymentStatus,
          paymentDate: paymentDate,
          metadata: {},
        });
      }

      const lifetimeMonths = monthsAgo;
      const lastPaymentDate = new Date(startDate);
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() + paymentCount - 1);

      const daysSinceLastPayment = Math.floor(
        (now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let churnRiskScore = 0;
      churnRiskScore += Math.min(failedPaymentsCount * 10, 30);
      if (daysSinceLastPayment > 45) churnRiskScore += 25;
      else if (daysSinceLastPayment > 35) churnRiskScore += 15;
      else if (daysSinceLastPayment > 30) churnRiskScore += 10;
      if (!isActive) churnRiskScore += 20;
      if (lifetimeMonths < 2) churnRiskScore += 10;
      else if (lifetimeMonths < 4) churnRiskScore += 5;
      churnRiskScore = Math.min(churnRiskScore, 100);

      let engagementScore = 0;
      const consistencyRate = successfulPayments / Math.max(lifetimeMonths, 1);
      engagementScore += Math.min(consistencyRate * 40, 40);
      if (daysSinceLastPayment < 7) engagementScore += 30;
      else if (daysSinceLastPayment < 14) engagementScore += 20;
      else if (daysSinceLastPayment < 30) engagementScore += 10;
      const failureRate = failedPaymentsCount / Math.max(paymentCount, 1);
      engagementScore += Math.round((1 - failureRate) * 15);
      engagementScore += Math.min(lifetimeMonths * 2, 15);
      engagementScore = Math.min(Math.round(engagementScore), 100);

      await db
        .insert(memberAnalytics)
        .values({
          companyId: dbCompanyId,
          memberId: member.id,
          totalRevenue: totalRevenue,
          totalPayments: successfulPayments,
          averagePayment: successfulPayments > 0 ? Math.round(totalRevenue / successfulPayments) : 0,
          lifetimeMonths: lifetimeMonths,
          lastPaymentAt: lastPaymentDate,
          churnRiskScore: churnRiskScore,
          engagementScore: engagementScore,
          calculatedAt: now,
        })
        .onConflictDoUpdate({
          target: [memberAnalytics.companyId, memberAnalytics.memberId],
          set: {
            totalRevenue: totalRevenue,
            totalPayments: successfulPayments,
            averagePayment: successfulPayments > 0 ? Math.round(totalRevenue / successfulPayments) : 0,
            lifetimeMonths: lifetimeMonths,
            lastPaymentAt: lastPaymentDate,
            churnRiskScore: churnRiskScore,
            engagementScore: engagementScore,
            calculatedAt: now,
          },
        });
    }

    return NextResponse.json({
      success: true,
      generated: {
        members: testMembers.length,
        memberships: testMemberships.length,
        payments: testPayments.length,
      },
    });
  } catch (error) {
    console.error("Test data generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate test data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
