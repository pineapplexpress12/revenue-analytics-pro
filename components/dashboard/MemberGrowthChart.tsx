"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="bg-gray-a2 border-gray-a4">
      <CardHeader>
        <div className="flex flex-row items-center justify-between mb-4">
          <CardTitle className="text-6 font-semibold text-gray-12">
            Member Growth
          </CardTitle>
          {onExport && data.length > 0 && (
            <button
              onClick={onExport}
              className="flex items-center gap-1 text-3 text-gray-11 hover:text-gray-12 transition"
            >
              <Download className="h-3 w-3" />
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
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
