import { DashboardMetrics } from "@/types";
import * as React from "react";

interface WeeklyReportEmailProps {
  companyName: string;
  metrics: DashboardMetrics;
  revenueData: Array<{ date: string; revenue: number }>;
  period: string;
}

export function WeeklyReportEmail({
  companyName,
  metrics,
  revenueData,
  period,
}: WeeklyReportEmailProps) {
  const totalWeeklyRevenue = revenueData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  return (
    <html>
      <head>
        <style>
          {`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.5;
              color: #1a1a1a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              border-bottom: 3px solid #8b5cf6;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              color: #1a1a1a;
            }
            .period {
              color: #666;
              font-size: 14px;
              margin-top: 4px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 24px;
            }
            .metric-card {
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 6px;
              border-left: 4px solid #8b5cf6;
            }
            .metric-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
            }
            .metric-change {
              font-size: 14px;
              margin-top: 4px;
            }
            .metric-change.positive {
              color: #10b981;
            }
            .metric-change.negative {
              color: #ef4444;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #8b5cf6;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 16px;
              font-weight: 500;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Weekly Revenue Report</h1>
            <div className="period">{companyName} • {period}</div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Monthly Recurring Revenue</div>
              <div className="metric-value">${metrics.mrr.toFixed(2)}</div>
              <div
                className={`metric-change ${metrics.mrrGrowth >= 0 ? "positive" : "negative"}`}
              >
                {metrics.mrrGrowth >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(metrics.mrrGrowth).toFixed(1)}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Active Members</div>
              <div className="metric-value">{metrics.activeMembers}</div>
              <div
                className={`metric-change ${metrics.memberGrowth >= 0 ? "positive" : "negative"}`}
              >
                {metrics.memberGrowth >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(metrics.memberGrowth)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Churn Rate</div>
              <div className="metric-value">{metrics.churnRate.toFixed(1)}%</div>
              <div
                className={`metric-change ${metrics.churnChange <= 0 ? "positive" : "negative"}`}
              >
                {metrics.churnChange <= 0 ? "↓" : "↑"}{" "}
                {Math.abs(metrics.churnChange).toFixed(1)}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Weekly Revenue</div>
              <div className="metric-value">
                ${totalWeeklyRevenue.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Revenue (All-Time)</div>
            <div className="metric-value">${metrics.totalRevenue.toFixed(2)}</div>
          </div>

          <div className="metric-card" style={{ marginTop: "16px" }}>
            <div className="metric-label">Average Revenue Per User (ARPU)</div>
            <div className="metric-value">${metrics.arpu.toFixed(2)}</div>
          </div>

          <div className="metric-card" style={{ marginTop: "16px" }}>
            <div className="metric-label">Lifetime Value (LTV)</div>
            <div className="metric-value">${metrics.ltv.toFixed(2)}</div>
          </div>

          <div className="footer">
            <p>
              This is your automated weekly revenue report from Revenue Analytics
              Pro.
            </p>
            <p style={{ marginTop: "8px" }}>
              View your full dashboard for detailed insights and charts.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

export function MonthlyReportEmail({
  companyName,
  metrics,
  revenueData,
  period,
}: WeeklyReportEmailProps) {
  const totalMonthlyRevenue = revenueData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  return (
    <html>
      <head>
        <style>
          {`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.5;
              color: #1a1a1a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              color: #1a1a1a;
            }
            .period {
              color: #666;
              font-size: 14px;
              margin-top: 4px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 24px;
            }
            .metric-card {
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 6px;
              border-left: 4px solid #3b82f6;
            }
            .metric-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
            }
            .metric-change {
              font-size: 14px;
              margin-top: 4px;
            }
            .metric-change.positive {
              color: #10b981;
            }
            .metric-change.negative {
              color: #ef4444;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .summary {
              background-color: #eff6ff;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 24px;
              border-left: 4px solid #3b82f6;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Monthly Revenue Report</h1>
            <div className="period">{companyName} • {period}</div>
          </div>

          <div className="summary">
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
              Monthly Highlights
            </h2>
            <p style={{ margin: "0", fontSize: "14px", color: "#374151" }}>
              Your business generated{" "}
              <strong>${totalMonthlyRevenue.toFixed(2)}</strong> in revenue this
              month with <strong>{metrics.activeMembers}</strong> active members.
            </p>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Monthly Recurring Revenue</div>
              <div className="metric-value">${metrics.mrr.toFixed(2)}</div>
              <div
                className={`metric-change ${metrics.mrrGrowth >= 0 ? "positive" : "negative"}`}
              >
                {metrics.mrrGrowth >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(metrics.mrrGrowth).toFixed(1)}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Active Members</div>
              <div className="metric-value">{metrics.activeMembers}</div>
              <div
                className={`metric-change ${metrics.memberGrowth >= 0 ? "positive" : "negative"}`}
              >
                {metrics.memberGrowth >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(metrics.memberGrowth)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Churn Rate</div>
              <div className="metric-value">{metrics.churnRate.toFixed(1)}%</div>
              <div
                className={`metric-change ${metrics.churnChange <= 0 ? "positive" : "negative"}`}
              >
                {metrics.churnChange <= 0 ? "↓" : "↑"}{" "}
                {Math.abs(metrics.churnChange).toFixed(1)}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Monthly Revenue</div>
              <div className="metric-value">
                ${totalMonthlyRevenue.toFixed(2)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Average Revenue Per User</div>
              <div className="metric-value">${metrics.arpu.toFixed(2)}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Lifetime Value</div>
              <div className="metric-value">${metrics.ltv.toFixed(2)}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Revenue (All-Time)</div>
            <div className="metric-value">${metrics.totalRevenue.toFixed(2)}</div>
          </div>

          <div className="footer">
            <p>
              This is your automated monthly revenue report from Revenue Analytics
              Pro.
            </p>
            <p style={{ marginTop: "8px" }}>
              View your full dashboard for detailed insights, charts, and cohort
              analysis.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
