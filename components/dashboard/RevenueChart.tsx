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
    <Card className="col-span-4 bg-gray-a2 border-gray-a4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-12">Revenue Over Time</CardTitle>
        {onExport && data.length > 0 && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 text-3 text-gray-11 hover:text-gray-12 transition"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        )}
      </CardHeader>
      <CardContent className="pl-2">
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
      </CardContent>
    </Card>
  );
}
