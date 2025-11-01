import { db } from "@/lib/db";
import { memberships } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function calculateChurnRate(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const allMemberships = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.companyId, companyId),
        lte(memberships.startDate, endDate)
      )
    );

  let activeAtStart = 0;
  let churnedDuringPeriod = 0;
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  for (const membership of allMemberships) {
    const membershipStartTime = new Date(membership.startDate).getTime();
    
    if (membershipStartTime <= startTime) {
      const membershipEndTime = membership.endDate 
        ? new Date(membership.endDate).getTime() 
        : Date.now();
      
      if (membershipEndTime >= startTime || membership.status === "active") {
        activeAtStart++;
        
        if (membership.status === "cancelled" && membership.endDate) {
          const cancelTime = new Date(membership.endDate).getTime();
          if (cancelTime >= startTime && cancelTime <= endTime) {
            churnedDuringPeriod++;
          }
        }
      }
    }
  }

  if (activeAtStart === 0) return 0;

  return Math.round((churnedDuringPeriod / activeAtStart) * 100 * 10) / 10;
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
