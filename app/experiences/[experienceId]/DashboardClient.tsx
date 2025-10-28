"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MemberGrowthChart } from "@/components/dashboard/MemberGrowthChart";
import { CohortAnalysis } from "@/components/dashboard/CohortAnalysis";
import { ProductPerformanceTable } from "@/components/dashboard/ProductPerformanceTable";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { downloadCSV, formatMetricsForExport } from "@/lib/csv-export";
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  CreditCard,
  ArrowUpDown,
} from "lucide-react";
import { DashboardMetrics } from "@/types";

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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [memberGrowthData, setMemberGrowthData] = useState<any[]>([]);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [metricsRes, revenueRes, memberGrowthRes, cohortRes, productRes] = await Promise.all([
          fetch(`/api/metrics/overview?companyId=${companyId}`),
          fetch(`/api/metrics/revenue?companyId=${companyId}&period=month`),
          fetch(`/api/metrics/member-growth?companyId=${companyId}&months=12`),
          fetch(`/api/metrics/cohorts?companyId=${companyId}&cohorts=6`),
          fetch(`/api/metrics/products?companyId=${companyId}`)
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
  }, [companyId]);

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
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-9 font-bold mb-4 text-gray-12">Access Denied</h1>
          <p className="text-4 text-gray-11">You don't have access to this dashboard.</p>
        </div>
      </div>
    );
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
        <div className="mb-8 flex items-start justify-between">
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
              <MemberGrowthChart data={memberGrowthData} onExport={handleExportMemberGrowth} />
            </div>

            <div className="mb-8">
              <CohortAnalysis data={cohortData} onExport={handleExportCohorts} />
            </div>

            <div className="mb-8">
              <ProductPerformanceTable data={productData} onExport={handleExportProducts} />
            </div>

            {/* Email reports temporarily disabled - will add in v2 with paid email service */}
            {/* <div className="mb-8">
              <EmailReportSettings companyId={companyId} companyName={companyName} userEmail={userEmail} />
            </div> */}

            <div className="bg-gray-a2 border border-gray-a4 rounded-3xl p-6">
              <h2 className="text-6 font-semibold mb-4 text-gray-12">Quick Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-l-4 border-purple-9 pl-4">
                  <p className="text-3 text-gray-11">Growth Rate</p>
                  <p className="text-7 font-bold text-purple-11">
                    +{metrics.mrrGrowth.toFixed(1)}%
                  </p>
                </div>
                <div className="border-l-4 border-blue-9 pl-4">
                  <p className="text-3 text-gray-11">Active Subscriptions</p>
                  <p className="text-7 font-bold text-blue-11">
                    {metrics.activeMembers}
                  </p>
                </div>
                <div className="border-l-4 border-green-9 pl-4">
                  <p className="text-3 text-gray-11">Monthly Revenue</p>
                  <p className="text-7 font-bold text-green-11">
                    ${metrics.mrr.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-gray-a3 text-gray-12 px-4 py-2 rounded-2 font-medium hover:bg-gray-a4 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
