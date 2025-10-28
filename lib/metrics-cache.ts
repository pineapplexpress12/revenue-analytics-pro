import { db } from "@/lib/db";
import { metricsCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

export async function getCachedMetric(
  companyId: string,
  metricType: string,
  periodStart: Date,
  periodEnd: Date
) {
  const cached = await db
    .select()
    .from(metricsCache)
    .where(
      and(
        eq(metricsCache.companyId, companyId),
        eq(metricsCache.metricType, metricType),
        eq(metricsCache.period, "daily"),
        eq(metricsCache.periodStart, startOfDay(periodStart)),
        eq(metricsCache.periodEnd, endOfDay(periodEnd))
      )
    )
    .limit(1);

  if (cached.length === 0) return null;

  const cacheEntry = cached[0];
  const cacheAge = Date.now() - new Date(cacheEntry.createdAt).getTime();
  const maxAge = 60 * 60 * 1000; // 1 hour

  if (cacheAge > maxAge) {
    return null;
  }

  return cacheEntry;
}

export async function setCachedMetric(
  companyId: string,
  metricType: string,
  metricValue: number | null,
  data: any | null,
  periodStart: Date,
  periodEnd: Date
) {
  const existing = await db
    .select()
    .from(metricsCache)
    .where(
      and(
        eq(metricsCache.companyId, companyId),
        eq(metricsCache.metricType, metricType),
        eq(metricsCache.period, "daily"),
        eq(metricsCache.periodStart, startOfDay(periodStart)),
        eq(metricsCache.periodEnd, endOfDay(periodEnd))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(metricsCache)
      .set({
        value: metricValue !== null ? String(metricValue) : "0",
        metadata: data,
        updatedAt: new Date(),
      })
      .where(eq(metricsCache.id, existing[0].id));
  } else {
    await db.insert(metricsCache).values({
      companyId,
      metricType,
      period: "daily",
      value: metricValue !== null ? String(metricValue) : "0",
      metadata: data,
      periodStart: startOfDay(periodStart),
      periodEnd: endOfDay(periodEnd),
    });
  }
}

export async function invalidateMetricCache(
  companyId: string,
  metricType?: string
) {
  if (metricType) {
    await db
      .delete(metricsCache)
      .where(
        and(
          eq(metricsCache.companyId, companyId),
          eq(metricsCache.metricType, metricType)
        )
      );
  } else {
    await db
      .delete(metricsCache)
      .where(eq(metricsCache.companyId, companyId));
  }
}
