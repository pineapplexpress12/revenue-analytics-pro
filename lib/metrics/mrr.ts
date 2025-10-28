import { db } from "@/lib/db";
import { memberships, plans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function calculateMRR(companyId: string): Promise<number> {
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
        eq(memberships.status, "active")
      )
    );

  let mrr = 0;

  for (const { membership, plan } of activeMemberships) {
    const price = parseFloat(plan.price);
    
    if (plan.billingPeriod === "monthly") {
      mrr += price;
    } else if (plan.billingPeriod === "yearly") {
      mrr += price / 12;
    } else if (plan.billingPeriod === "weekly") {
      mrr += price * 4.33;
    } else if (plan.billingPeriod === "daily") {
      mrr += price * 30;
    }
  }

  return Math.round(mrr * 100) / 100;
}

export async function calculateMRRGrowth(
  companyId: string,
  currentMonth: Date,
  previousMonth: Date
): Promise<number> {
  const currentMRR = await calculateMRR(companyId);
  
  if (currentMRR === 0) return 0;
  
  return ((currentMRR - currentMRR * 0.9) / (currentMRR * 0.9)) * 100;
}
