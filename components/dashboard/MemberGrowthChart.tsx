"use client";

import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MemberGrowthData {
  date: string;
  members: number;
  newMembers: number;
  churnedMembers: number;
}

interface MemberGrowthChartProps {
  data: MemberGrowthData[];
  onExport?: () => void;
  months?: number;
  onMonthsChange?: (months: number) => void;
}

export function MemberGrowthChart({ data, onExport, months = 12, onMonthsChange }: MemberGrowthChartProps) {
  return (
    <div className="whop-card">
      <div className="mb-6">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--whop-text-primary)]">
            Member Growth
          </h3>
          {onExport && data.length > 0 && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-transparent border border-[var(--whop-border)] text-[var(--whop-text-secondary)] hover:bg-[var(--whop-card-bg)] hover:border-gray-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
        {onMonthsChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show last:</span>
            <select
              value={months}
              onChange={(e) => onMonthsChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium shadow-sm"
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="#888"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--gray-a3)",
                border: "1px solid var(--gray-a6)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--gray-12)" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="members"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Total Members"
            />
            <Line
              type="monotone"
              dataKey="newMembers"
              stroke="#10b981"
              strokeWidth={2}
              name="New Members"
            />
            <Line
              type="monotone"
              dataKey="churnedMembers"
              stroke="#ef4444"
              strokeWidth={2}
              name="Churned"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
