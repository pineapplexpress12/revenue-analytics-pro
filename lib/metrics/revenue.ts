import { db } from "@/lib/db";
import { payments, memberships } from "@/lib/db/schema";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import { calculateMRR } from "./mrr";

export async function calculateTotalRevenue(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const conditions = [
    eq(payments.companyId, companyId),
    eq(payments.status, "succeeded")
  ];

  if (startDate) {
    conditions.push(gte(payments.paymentDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(payments.paymentDate, endDate));
  }

  const result = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(and(...conditions));

  return parseFloat(result[0]?.total || "0");
}

export async function calculateRevenueGrowth(
  companyId: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): Promise<number> {
  const currentRevenue = await calculateTotalRevenue(
    companyId,
    currentStart,
    currentEnd
  );
  const previousRevenue = await calculateTotalRevenue(
    companyId,
    previousStart,
    previousEnd
  );

  if (previousRevenue === 0) return 0;

  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

export async function calculateARPU(companyId: string): Promise<number> {
  const mrr = await calculateMRR(companyId);
  
  const activeCount = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.companyId, companyId),
        eq(memberships.status, "active")
      )
    );

  if (activeCount.length === 0) return 0;

  return Math.round((mrr / activeCount.length) * 100) / 100;
}

export async function getRevenueTimeSeries(
  companyId: string,
  startDate: Date,
  endDate: Date,
  interval: 'day' | 'week' | 'month' = 'month'
) {
  const allPayments = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.status, "succeeded"),
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate)
      )
    )
    .orderBy(payments.paymentDate);

  const grouped = new Map<string, number>();

  for (const payment of allPayments) {
    const date = new Date(payment.paymentDate);
    let key: string;

    if (interval === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (interval === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    const current = grouped.get(key) || 0;
    grouped.set(key, current + parseFloat(payment.amount));
  }

  return Array.from(grouped.entries()).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
}
