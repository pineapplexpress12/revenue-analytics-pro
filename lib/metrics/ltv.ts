import { db } from "@/lib/db";
import { memberships, payments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateARPU } from "./revenue";

export async function calculateLTV(companyId: string): Promise<number> {
  const arpu = await calculateARPU(companyId);
  const avgLifespan = await calculateAverageLifespan(companyId);

  return Math.round(arpu * avgLifespan * 100) / 100;
}

export async function calculateAverageLifespan(
  companyId: string
): Promise<number> {
  const churned = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.companyId, companyId),
        eq(memberships.status, "cancelled")
      )
    );

  if (churned.length === 0) return 12;

  let totalMonths = 0;

  for (const membership of churned) {
    const start = new Date(membership.startDate);
    const end = membership.endDate
      ? new Date(membership.endDate)
      : new Date();
    const months =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    totalMonths += months;
  }

  return totalMonths / churned.length;
}
