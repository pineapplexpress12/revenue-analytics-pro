"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  CreditCard,
  ArrowUpDown,
} from "lucide-react";
import { DashboardMetrics } from "@/types";

export default function Page() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("companyId") || "biz_wBZsNrZ6yzDAds";
    setCompanyId(id);

    async function fetchMetrics() {
      try {
        const response = await fetch(`/api/metrics/overview?companyId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  const revenueData = [
    { date: "Jan", revenue: 8500, mrr: 8000 },
    { date: "Feb", revenue: 9200, mrr: 8500 },
    { date: "Mar", revenue: 10100, mrr: 9200 },
    { date: "Apr", revenue: 11500, mrr: 10500 },
    { date: "May", revenue: 12450, mrr: 11200 },
  ];

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Revenue Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track your key metrics and grow your business
          </p>
        </div>

        {!metrics ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome to Revenue Analytics Pro
            </h2>
            <p className="text-gray-600 mb-6">
              Get started by syncing your Whop data
            </p>
            <button
              onClick={async () => {
                if (!companyId) return;
                setLoading(true);
                try {
                  const response = await fetch("/api/sync/initial", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      companyId,
                      companyName: "I will make it",
                    }),
                  });
                  if (response.ok) {
                    window.location.reload();
                  }
                } catch (error) {
                  console.error("Sync failed:", error);
                  setLoading(false);
                }
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Sync Data Now
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
              <RevenueChart data={revenueData} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    +{metrics.mrrGrowth.toFixed(1)}%
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.activeMembers}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${metrics.mrr.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
