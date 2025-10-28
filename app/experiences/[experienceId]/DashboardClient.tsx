"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MemberGrowthChart } from "@/components/dashboard/MemberGrowthChart";
import { CohortAnalysis } from "@/components/dashboard/CohortAnalysis";
import { ProductPerformanceTable } from "@/components/dashboard/ProductPerformanceTable";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { downloadCSV, formatMetricsForExport } from "@/lib/csv-export";
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  CreditCard,
  ArrowUpDown,
  LayoutDashboard,
  UserCircle,
} from "lucide-react";
import { DashboardMetrics } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";

interface DashboardClientProps {
  companyId: string;
  companyName: string;
  userName: string;
  hasAccess: boolean;
}

export function DashboardClient({ 
  companyId, 
  companyName, 
  userName,
  hasAccess
}: DashboardClientProps) {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [memberGrowthData, setMemberGrowthData] = useState<any[]>([]);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string; compareStart?: string; compareEnd?: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month'>('month');
  const [memberGrowthMonths, setMemberGrowthMonths] = useState(12);
  const [cohortCount, setCohortCount] = useState(6);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [metricsRes, revenueRes, memberGrowthRes, cohortRes, productRes] = await Promise.all([
          fetch(`/api/metrics/overview?companyId=${companyId}`),
          fetch(`/api/metrics/revenue?companyId=${companyId}&period=${revenuePeriod}&startDate=${dateRange.start}&endDate=${dateRange.end}`),
          fetch(`/api/metrics/member-growth?companyId=${companyId}&months=${memberGrowthMonths}`),
          fetch(`/api/metrics/cohorts?companyId=${companyId}&cohorts=${cohortCount}`),
          fetch(`/api/metrics/products?companyId=${companyId}&startDate=${dateRange.start}&endDate=${dateRange.end}`)
        ]);
        
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }
        
        if (revenueRes.ok) {
          const data = await revenueRes.json();
          setRevenueData(data.data || []);
        }
        
        if (memberGrowthRes.ok) {
          const data = await memberGrowthRes.json();
          setMemberGrowthData(data.data || []);
        }
        
        if (cohortRes.ok) {
          const data = await cohortRes.json();
          setCohortData(data.data || []);
        }
        
        if (productRes.ok) {
          const data = await productRes.json();
          setProductData(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [companyId, dateRange, revenuePeriod, memberGrowthMonths, cohortCount]);

  const handleExportMetrics = () => {
    if (!metrics) return;
    const exportData = formatMetricsForExport(metrics);
    downloadCSV(exportData, `metrics-${companyName}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportRevenue = () => {
    if (revenueData.length === 0) return;
    downloadCSV(revenueData, `revenue-${companyName}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportMemberGrowth = () => {
    if (memberGrowthData.length === 0) return;
    downloadCSV(memberGrowthData, `member-growth-${companyName}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportCohorts = () => {
    if (cohortData.length === 0) return;
    const flattenedData = cohortData.map(cohort => ({
      cohort: cohort.cohort,
      size: cohort.size,
      month0: `${cohort.retention.month0.toFixed(1)}%`,
      month1: cohort.retention.month1 >= 0 ? `${cohort.retention.month1.toFixed(1)}%` : "-",
      month2: cohort.retention.month2 >= 0 ? `${cohort.retention.month2.toFixed(1)}%` : "-",
      month3: cohort.retention.month3 >= 0 ? `${cohort.retention.month3.toFixed(1)}%` : "-",
      month4: cohort.retention.month4 >= 0 ? `${cohort.retention.month4.toFixed(1)}%` : "-",
      month5: cohort.retention.month5 >= 0 ? `${cohort.retention.month5.toFixed(1)}%` : "-",
    }));
    downloadCSV(flattenedData, `cohorts-${companyName}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportProducts = () => {
    if (productData.length === 0) return;
    downloadCSV(productData, `products-${companyName}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync/initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          companyName,
        }),
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncing(false);
    }
  };


  if (!hasAccess) {
    return <UpgradePrompt />;
  }

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-9 font-bold mb-4 text-gray-12">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-[var(--whop-border)]">
          <nav className="flex gap-6">
            <Link
              href={`/experiences/${experienceId}`}
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-[var(--whop-accent)] text-[var(--whop-accent)] font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href={`/experiences/${experienceId}/members`}
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-transparent text-[var(--whop-text-secondary)] hover:text-[var(--whop-text-primary)] hover:border-gray-600 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              Members
            </Link>
          </nav>
        </div>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-9 font-bold mb-2">
                Revenue Analytics Dashboard
              </h1>
              <p className="text-4 text-gray-11">
                Welcome back, {userName}! Track your key metrics for {companyName}
              </p>
            </div>
            {metrics && (
              <ExportButton onClick={handleExportMetrics} label="Export All Metrics" />
            )}
          </div>
          {metrics && (
            <div className="flex items-center gap-4">
              <DateRangePicker 
                onDateRangeChange={(start, end, compareStart, compareEnd) => 
                  setDateRange({ start, end, compareStart, compareEnd })
                }
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Revenue view:</span>
                <select
                  value={revenuePeriod}
                  onChange={(e) => setRevenuePeriod(e.target.value as 'day' | 'week' | 'month')}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium shadow-sm"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {!metrics ? (
          <div className="bg-gray-a2 border border-gray-a4 rounded-3xl p-8 text-center">
            <h2 className="text-7 font-semibold mb-4 text-gray-12">
              Welcome to Revenue Analytics Pro
            </h2>
            <p className="text-4 text-gray-11 mb-6">
              Get started by syncing your Whop data to see your analytics
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-purple-9 text-white px-6 py-3 rounded-2 font-medium hover:bg-purple-10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? "Syncing..." : "Sync Data Now"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <MetricCard
                title="Monthly Recurring Revenue"
                value={metrics.mrr.toFixed(2)}
                prefix="$"
                change={metrics.mrrGrowth}
                trend={metrics.mrrGrowth > 0 ? "up" : "down"}
                icon={DollarSign}
              />
              <MetricCard
                title="Total Revenue"
                value={metrics.totalRevenue.toFixed(2)}
                prefix="$"
                icon={TrendingUp}
                description="All-time revenue"
              />
              <MetricCard
                title="Active Members"
                value={metrics.activeMembers}
                change={metrics.memberGrowth}
                trend={metrics.memberGrowth > 0 ? "up" : "neutral"}
                icon={Users}
              />
              <MetricCard
                title="Churn Rate"
                value={metrics.churnRate.toFixed(1)}
                suffix="%"
                change={metrics.churnChange}
                trend={metrics.churnChange < 0 ? "up" : "down"}
                icon={Activity}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <MetricCard
                title="Lifetime Value (LTV)"
                value={metrics.ltv.toFixed(2)}
                prefix="$"
                icon={CreditCard}
                description="Average customer value"
              />
              <MetricCard
                title="ARPU"
                value={metrics.arpu.toFixed(2)}
                prefix="$"
                icon={ArrowUpDown}
                description="Average revenue per user"
              />
            </div>

            <div className="mb-8">
              <RevenueChart data={revenueData} onExport={handleExportRevenue} />
            </div>

            <div className="mb-8">
              <MemberGrowthChart 
                data={memberGrowthData} 
                onExport={handleExportMemberGrowth}
                months={memberGrowthMonths}
                onMonthsChange={setMemberGrowthMonths}
              />
            </div>

            <div className="mb-8">
              <CohortAnalysis 
                data={cohortData} 
                onExport={handleExportCohorts}
                cohortCount={cohortCount}
                onCohortCountChange={setCohortCount}
              />
            </div>

            <div className="mb-8">
              <ProductPerformanceTable data={productData} onExport={handleExportProducts} />
            </div>

            {/* Email reports temporarily disabled - will add in v2 with paid email service */}
            {/* <div className="mb-8">
              <EmailReportSettings companyId={companyId} companyName={companyName} userEmail={userEmail} />
            </div> */}

            <div className="whop-card">
              <h2 className="text-lg font-semibold mb-6 text-[var(--whop-text-primary)]">Quick Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-[var(--whop-text-secondary)]">Growth Rate</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">
                    +{metrics.mrrGrowth.toFixed(1)}%
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-[var(--whop-text-secondary)]">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {metrics.activeMembers}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-[var(--whop-text-secondary)]">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    ${metrics.mrr.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-3 text-sm rounded-lg bg-[var(--whop-accent)] text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {syncing ? "Syncing..." : "Refresh Data"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
