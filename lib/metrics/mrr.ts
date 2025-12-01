import { db } from "@/lib/db";
import { memberships, plans } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function calculateMRR(companyId: string, asOfDate?: Date): Promise<number> {
  const conditions = [eq(memberships.companyId, companyId)];

  if (asOfDate) {
    const asOfTime = asOfDate.getTime();
    const allMembershipsData = await db
      .select({
        membership: memberships,
        plan: plans,
      })
      .from(memberships)
      .innerJoin(plans, eq(memberships.planId, plans.id))
      .where(and(...conditions));

    let mrr = 0;

    for (const { membership, plan } of allMembershipsData) {
      const startTime = new Date(membership.startDate).getTime();
      const endTime = membership.endDate ? new Date(membership.endDate).getTime() : Date.now();

      if (startTime <= asOfTime && endTime >= asOfTime) {
        const price = parseFloat(plan.price);
        const billingPeriod = plan.billingPeriod;

        if (billingPeriod === "monthly" || billingPeriod === "month" || billingPeriod === "30") {
          mrr += price;
        } else if (billingPeriod === "yearly" || billingPeriod === "year" || billingPeriod === "365") {
          mrr += price / 12;
        } else if (billingPeriod === "weekly" || billingPeriod === "week" || billingPeriod === "7") {
          mrr += price * 4.33;
        } else if (billingPeriod === "daily" || billingPeriod === "day" || billingPeriod === "1") {
          mrr += price * 30;
        } else if (typeof billingPeriod === 'string' && billingPeriod.match(/^\d+$/)) {
          const days = parseInt(billingPeriod);
          if (days > 0) {
            mrr += (price * 30 / days);
          }
        }
      }
    }

    return Math.round(mrr * 100) / 100;
  }

  // Include active and trialing memberships in MRR calculation
  const activeMemberships = await db
    .select({
      membership: memberships,
      plan: plans,
    })
    .from(memberships)
    .innerJoin(plans, eq(memberships.planId, plans.id))
    .where(
      and(
        eq(memberships.companyId, companyId),
        sql`${memberships.status} IN ('active', 'trialing')`
      )
    );

  let mrr = 0;

  for (const { plan } of activeMemberships) {
    const price = parseFloat(plan.price);
    const billingPeriod = plan.billingPeriod;

    if (billingPeriod === "monthly" || billingPeriod === "month" || billingPeriod === "30") {
      mrr += price;
    } else if (billingPeriod === "yearly" || billingPeriod === "year" || billingPeriod === "365") {
      mrr += price / 12;
    } else if (billingPeriod === "weekly" || billingPeriod === "week" || billingPeriod === "7") {
      mrr += price * 4.33;
    } else if (billingPeriod === "daily" || billingPeriod === "day" || billingPeriod === "1") {
      mrr += price * 30;
    } else if (typeof billingPeriod === 'string' && billingPeriod.match(/^\d+$/)) {
      const days = parseInt(billingPeriod);
      if (days > 0) {
        mrr += (price * 30 / days);
      }
    }
  }

  return Math.round(mrr * 100) / 100;
}

export async function calculateMRRGrowth(
  companyId: string,
  _currentMonth: Date,
  previousMonth: Date
): Promise<number> {
  const currentMRR = await calculateMRR(companyId);

  // Include active and trialing for previous month calculation
  const previousMemberships = await db
    .select({
      membership: memberships,
      plan: plans,
    })
    .from(memberships)
    .innerJoin(plans, eq(memberships.planId, plans.id))
    .where(
      and(
        eq(memberships.companyId, companyId),
        sql`${memberships.status} IN ('active', 'trialing', 'canceled', 'expired')`
      )
    );

  let previousMRR = 0;
  const previousMonthTime = previousMonth.getTime();

  for (const { membership, plan } of previousMemberships) {
    const startTime = new Date(membership.startDate).getTime();
    const endTime = membership.endDate ? new Date(membership.endDate).getTime() : Date.now();

    if (startTime <= previousMonthTime && endTime >= previousMonthTime) {
      const price = parseFloat(plan.price);
      const billingPeriod = plan.billingPeriod;

      if (billingPeriod === "monthly" || billingPeriod === "month" || billingPeriod === "30") {
        previousMRR += price;
      } else if (billingPeriod === "yearly" || billingPeriod === "year" || billingPeriod === "365") {
        previousMRR += price / 12;
      } else if (billingPeriod === "weekly" || billingPeriod === "week" || billingPeriod === "7") {
        previousMRR += price * 4.33;
      } else if (billingPeriod === "daily" || billingPeriod === "day" || billingPeriod === "1") {
        previousMRR += price * 30;
      } else if (typeof billingPeriod === 'string' && billingPeriod.match(/^\d+$/)) {
        const days = parseInt(billingPeriod);
        if (days > 0) {
          previousMRR += (price * 30 / days);
        }
      }
    }
  }

  if (previousMRR === 0) return currentMRR > 0 ? 100 : 0;

  return Math.round(((currentMRR - previousMRR) / previousMRR) * 100 * 10) / 10;
}
