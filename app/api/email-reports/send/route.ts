import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateMRR, calculateMRRGrowth } from "@/lib/metrics/mrr";
import { calculateTotalRevenue, calculateARPU } from "@/lib/metrics/revenue";
import { calculateChurnRate } from "@/lib/metrics/churn";
import { calculateLTV } from "@/lib/metrics/ltv";
import { WeeklyReportEmail, MonthlyReportEmail } from "@/lib/email-templates";
import { render } from "@react-email/render";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    const { companyId: whopCompanyId, recipientEmail, frequency } = await request.json();

    if (!whopCompanyId || !recipientEmail || !frequency) {
      return NextResponse.json(
        { error: "companyId, recipientEmail, and frequency are required" },
        { status: 400 }
      );
    }

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.whopCompanyId, whopCompanyId))
      .limit(1);

    if (!company[0]) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = company[0].id;

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const mrr = await calculateMRR(companyId);
    const mrrGrowth = await calculateMRRGrowth(companyId, now, lastMonth);
    const totalRevenue = await calculateTotalRevenue(companyId);
    const churnRate = await calculateChurnRate(companyId, lastMonth, now);
    const ltv = await calculateLTV(companyId);
    const arpu = await calculateARPU(companyId);

    const metrics = {
      mrr: Math.round(mrr * 100) / 100,
      mrrGrowth: Math.round(mrrGrowth * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeMembers: 0,
      memberGrowth: 0,
      churnRate: Math.round(churnRate * 10) / 10,
      churnChange: 0,
      ltv: Math.round(ltv * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
    };

    const revenueDataResponse = await fetch(
      `${request.nextUrl.origin}/api/metrics/revenue?companyId=${companyId}&period=${frequency === "weekly" ? "week" : "month"}`,
      {
        headers: request.headers,
      }
    );

    let revenueData = [];
    if (revenueDataResponse.ok) {
      const data = await revenueDataResponse.json();
      revenueData = data.data || [];
    }

    const isWeekly = frequency === "weekly";
    const periodStart = isWeekly
      ? startOfWeek(now)
      : startOfMonth(now);
    const periodEnd = isWeekly ? endOfWeek(now) : endOfMonth(now);
    const period = `${format(periodStart, "MMM d")} - ${format(periodEnd, "MMM d, yyyy")}`;

    const EmailTemplate = isWeekly ? WeeklyReportEmail : MonthlyReportEmail;
    const emailHtml = await render(
      EmailTemplate({
        companyName: company[0].name,
        metrics,
        revenueData,
        period,
      })
    );

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [recipientEmail],
      subject: `${isWeekly ? "Weekly" : "Monthly"} Revenue Report - ${company[0].name}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error("Error sending report:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
