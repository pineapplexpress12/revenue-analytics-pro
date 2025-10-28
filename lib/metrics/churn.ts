import { db } from "@/lib/db";
import { memberships } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function calculateChurnRate(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const startCount = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.companyId, companyId),
        eq(memberships.status, "active"),
        lte(memberships.startDate, startDate)
      )
    );

  const churned = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.companyId, companyId),
        gte(memberships.updatedAt, startDate),
        lte(memberships.updatedAt, endDate),
        eq(memberships.status, "cancelled")
      )
    );

  if (startCount.length === 0) return 0;

  return (churned.length / startCount.length) * 100;
}

export async function getChurnedMemberships(
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [
    eq(memberships.companyId, companyId),
    eq(memberships.status, "cancelled")
  ];

  if (startDate) {
    conditions.push(gte(memberships.updatedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(memberships.updatedAt, endDate));
  }

  return await db
    .select()
    .from(memberships)
    .where(and(...conditions));
}
