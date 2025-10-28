"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

interface CohortData {
  cohort: string;
  size: number;
  retention: {
    month0: number;
    month1: number;
    month2: number;
    month3: number;
    month4: number;
    month5: number;
  };
}

interface CohortAnalysisProps {
  data: CohortData[];
  onExport?: () => void;
  cohortCount?: number;
  onCohortCountChange?: (count: number) => void;
}

function getRetentionColor(rate: number): string {
  if (rate >= 80) return "bg-green-9/20 text-green-11";
  if (rate >= 60) return "bg-blue-9/20 text-blue-11";
  if (rate >= 40) return "bg-yellow-9/20 text-yellow-11";
  if (rate >= 20) return "bg-orange-9/20 text-orange-11";
  return "bg-red-9/20 text-red-11";
}

export function CohortAnalysis({ data, onExport, cohortCount = 6, onCohortCountChange }: CohortAnalysisProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-a2 border-gray-a4">
        <CardHeader>
          <CardTitle className="text-6 font-semibold text-gray-12">
            Cohort Retention Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3 text-gray-11">No cohort data available yet. Sync your data to see retention analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-a2 border-gray-a4">
      <CardHeader>
        <div className="flex flex-row items-start justify-between mb-4">
          <div>
            <CardTitle className="text-6 font-semibold text-gray-12">
              Cohort Retention Analysis
            </CardTitle>
            <p className="text-3 text-gray-11 mt-2">
              Percentage of members still active from each signup month
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
        </div>
        {onCohortCountChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show last:</span>
            <select
              value={cohortCount}
              onChange={(e) => onCohortCountChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium shadow-sm"
            >
              <option value="3">3 cohorts</option>
              <option value="6">6 cohorts</option>
              <option value="12">12 cohorts</option>
            </select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-3">
            <thead>
              <tr className="border-b border-gray-a6">
                <th className="text-left py-3 px-2 text-gray-11 font-medium">Cohort</th>
                <th className="text-right py-3 px-2 text-gray-11 font-medium">Size</th>
                <th className="text-center py-3 px-2 text-gray-11 font-medium">M0</th>
                <th className="text-center py-3 px-2 text-gray-11 font-medium">M1</th>
                <th className="text-center py-3 px-2 text-gray-11 font-medium">M2</th>
                <th className="text-center py-3 px-2 text-gray-11 font-medium">M3</th>
                <th className="text-center py-3 px-2 text-gray-11 font-medium">M4</th>
                <th className="text-center py-3 px-2 text-gray-11 font-medium">M5</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cohort) => (
                <tr key={cohort.cohort} className="border-b border-gray-a4">
                  <td className="py-3 px-2 text-gray-12 font-medium">{cohort.cohort}</td>
                  <td className="py-3 px-2 text-right text-gray-12">{cohort.size}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-1 rounded-1 ${getRetentionColor(cohort.retention.month0)}`}>
                      {cohort.retention.month0.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {cohort.retention.month1 >= 0 ? (
                      <span className={`px-2 py-1 rounded-1 ${getRetentionColor(cohort.retention.month1)}`}>
                        {cohort.retention.month1.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-a8">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {cohort.retention.month2 >= 0 ? (
                      <span className={`px-2 py-1 rounded-1 ${getRetentionColor(cohort.retention.month2)}`}>
                        {cohort.retention.month2.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-a8">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {cohort.retention.month3 >= 0 ? (
                      <span className={`px-2 py-1 rounded-1 ${getRetentionColor(cohort.retention.month3)}`}>
                        {cohort.retention.month3.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-a8">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {cohort.retention.month4 >= 0 ? (
                      <span className={`px-2 py-1 rounded-1 ${getRetentionColor(cohort.retention.month4)}`}>
                        {cohort.retention.month4.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-a8">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {cohort.retention.month5 >= 0 ? (
                      <span className={`px-2 py-1 rounded-1 ${getRetentionColor(cohort.retention.month5)}`}>
                        {cohort.retention.month5.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-a8">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-1 bg-green-9/20"></div>
            <span className="text-gray-11">80%+ Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-1 bg-blue-9/20"></div>
            <span className="text-gray-11">60-80% Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-1 bg-yellow-9/20"></div>
            <span className="text-gray-11">40-60% Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-1 bg-orange-9/20"></div>
            <span className="text-gray-11">20-40% Below Avg</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-1 bg-red-9/20"></div>
            <span className="text-gray-11">&lt;20% Poor</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
