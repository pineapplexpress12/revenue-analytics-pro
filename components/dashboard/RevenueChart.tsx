"use client";

import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    mrr?: number;
  }>;
  onExport?: () => void;
}

export function RevenueChart({ data, onExport }: RevenueChartProps) {
  return (
    <div className="whop-card">
      <div className="flex flex-row items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--whop-text-primary)]">Revenue Over Time</h3>
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
      <div className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Revenue"
            />
            {data[0]?.mrr !== undefined && (
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="MRR"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
