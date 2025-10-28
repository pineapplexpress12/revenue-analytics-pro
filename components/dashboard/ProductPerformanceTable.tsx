"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

interface ProductMetric {
  id: string;
  name: string;
  revenue: number;
  mrr: number;
  activeMembers: number;
  totalMembers: number;
  churnRate: number;
  plans: number;
}

interface ProductPerformanceTableProps {
  data: ProductMetric[];
  onExport?: () => void;
}

export function ProductPerformanceTable({ data, onExport }: ProductPerformanceTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-a2 border-gray-a4">
        <CardHeader>
          <CardTitle className="text-6 font-semibold text-gray-12">
            Product Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3 text-gray-11">No product data available yet. Sync your data to see product performance.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-a2 border-gray-a4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-6 font-semibold text-gray-12">
            Product Performance
          </CardTitle>
          <p className="text-3 text-gray-11 mt-2">
            Revenue, members, and metrics by product
          </p>
        </div>
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
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-3">
            <thead>
              <tr className="border-b border-gray-a6">
                <th className="text-left py-3 px-2 text-gray-11 font-medium">Product</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">Revenue</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">MRR</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">Active</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">Total</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">Churn</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">Plans</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product) => (
                <tr key={product.id} className="border-b border-gray-a4 hover:bg-gray-a3">
                  <td className="py-3 px-2 text-gray-12 font-medium">{product.name}</td>
                  <td className="py-3 px-2 text-right text-gray-12">
                    ${product.revenue.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-12">
                    ${product.mrr.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-12">
                    {product.activeMembers}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-11">
                    {product.totalMembers}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`px-2 py-1 rounded-1 ${
                      product.churnRate < 5 
                        ? 'bg-green-9/20 text-green-11' 
                        : product.churnRate < 10 
                        ? 'bg-yellow-9/20 text-yellow-11' 
                        : 'bg-red-9/20 text-red-11'
                    }`}>
                      {product.churnRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-gray-11">
                    {product.plans}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-gray-a3 rounded-2 border border-gray-a4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-3">
            <div>
              <p className="text-gray-11 mb-1">Total Products</p>
              <p className="text-6 font-bold text-gray-12">{data.length}</p>
            </div>
            <div>
              <p className="text-gray-11 mb-1">Total Revenue</p>
              <p className="text-6 font-bold text-gray-12">
                ${data.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-11 mb-1">Total MRR</p>
              <p className="text-6 font-bold text-gray-12">
                ${data.reduce((sum, p) => sum + p.mrr, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
