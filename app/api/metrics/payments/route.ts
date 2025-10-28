import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const allPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.companyId, companyId));

    const succeeded = allPayments.filter(p => p.status === "succeeded");
    const failed = allPayments.filter(p => p.status === "failed");

    const totalPayments = succeeded.length;
    const failedCount = failed.length;
    const successRate = totalPayments + failedCount > 0
      ? (totalPayments / (totalPayments + failedCount)) * 100
      : 0;

    const totalAmount = succeeded.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averageValue = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const methodBreakdown: Record<string, number> = {};
    for (const payment of succeeded) {
      const method = (payment.metadata as any)?.payment_processor || "card";
      methodBreakdown[method] = (methodBreakdown[method] || 0) + 1;
    }

    return NextResponse.json({
      totalPayments,
      successRate: Math.round(successRate * 10) / 10,
      failedCount,
      averageValue: Math.round(averageValue * 100) / 100,
      methodBreakdown,
    });
  } catch (error) {
    console.error("Error fetching payment metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment metrics" },
      { status: 500 }
    );
  }
}
