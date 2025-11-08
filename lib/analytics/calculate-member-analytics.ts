import { db } from "@/lib/db";
import { members, memberAnalytics, payments, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateChurnRisk,
  calculateEngagementScore,
  calculateTotalRevenue,
  calculateAveragePayment,
  calculateLifetimeMonths,
  getLastPaymentDate,
} from "./member-scoring";

export async function calculateAndStoreMemberAnalytics(companyId: string) {
  const allMembers = await db
    .select()
    .from(members)
    .where(eq(members.companyId, companyId));

  for (const member of allMembers) {
    const memberPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.memberId, member.id));

    const memberMemberships = await db
      .select()
      .from(memberships)
      .where(eq(memberships.memberId, member.id));

    const lifetimeMonths = calculateLifetimeMonths(member.createdAt);
    const lastPaymentAt = getLastPaymentDate(memberPayments);
    const totalRevenue = calculateTotalRevenue(memberPayments);
    const averagePayment = calculateAveragePayment(memberPayments);

    const memberData = {
      member: {
        id: member.id,
        createdAt: member.createdAt,
      },
      payments: memberPayments,
      memberships: memberMemberships.map((m) => ({
        status: m.status,
        cancelAtPeriodEnd: false,
      })),
      analytics: {
        lifetimeMonths,
        lastPaymentAt,
      },
    };

    const churnRiskScore = calculateChurnRisk(memberData);
    const engagementScore = calculateEngagementScore(memberData);

    await db
      .insert(memberAnalytics)
      .values({
        memberId: member.id,
        totalRevenue: String(totalRevenue),
        totalPayments: memberPayments.filter((p) => p.status === "succeeded").length,
        averagePayment: String(averagePayment),
        lifetimeMonths,
        lastPaymentAt,
        churnRiskScore,
        engagementScore,
        calculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: memberAnalytics.memberId,
        set: {
          totalRevenue: String(totalRevenue),
          totalPayments: memberPayments.filter((p) => p.status === "succeeded").length,
          averagePayment: String(averagePayment),
          lifetimeMonths,
          lastPaymentAt,
          churnRiskScore,
          engagementScore,
          calculatedAt: new Date(),
        },
      });
  }
}
