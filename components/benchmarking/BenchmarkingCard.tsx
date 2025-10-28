'use client';

import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface BenchmarkMetric {
  label: string;
  yours: number;
  average: number;
  percentile: number;
  status: 'above' | 'below' | 'average';
  formatter: (val: number) => string;
}

interface BenchmarkingCardProps {
  comparison: {
    niche: string;
    revenueRange: string;
    mrr: {
      yours: number;
      average: number;
      percentile: number;
      status: 'above' | 'below' | 'average';
    };
    churnRate: {
      yours: number;
      average: number;
      percentile: number;
      status: 'above' | 'below' | 'average';
    };
    ltv: {
      yours: number;
      average: number;
      percentile: number;
      status: 'above' | 'below' | 'average';
    };
    arpu: {
      yours: number;
      average: number;
      percentile: number;
      status: 'above' | 'below' | 'average';
    };
    sampleSize: number;
  };
}

function formatCurrency(val: number): string {
  return `$${val.toFixed(2)}`;
}

function formatPercentage(val: number): string {
  return `${val.toFixed(1)}%`;
}

function BenchmarkRow({ metric }: { metric: BenchmarkMetric }) {
  const Icon = metric.status === 'above' ? TrendingUp : 
               metric.status === 'below' ? TrendingDown : Minus;
  
  const color = metric.status === 'above' ? 'text-green-400' :
                metric.status === 'below' ? 'text-red-400' : 'text-gray-400';
  
  const bgColor = metric.status === 'above' ? 'bg-green-500/10' :
                  metric.status === 'below' ? 'bg-red-500/10' : 'bg-gray-500/10';
  
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--whop-border)] last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--whop-text-primary)]">{metric.label}</p>
        <p className="text-xs text-[var(--whop-text-tertiary)] mt-1">
          Avg: {metric.formatter(metric.average)}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-bold text-[var(--whop-text-primary)]">
            {metric.formatter(metric.yours)}
          </p>
          <p className={`text-xs ${color} mt-1`}>
            Top {100 - metric.percentile}%
          </p>
        </div>
        
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export function BenchmarkingCard({ comparison }: BenchmarkingCardProps) {
  const metrics: BenchmarkMetric[] = [
    {
      label: 'MRR',
      yours: comparison.mrr.yours,
      average: comparison.mrr.average,
      percentile: comparison.mrr.percentile,
      status: comparison.mrr.status,
      formatter: formatCurrency,
    },
    {
      label: 'Churn Rate',
      yours: comparison.churnRate.yours,
      average: comparison.churnRate.average,
      percentile: comparison.churnRate.percentile,
      status: comparison.churnRate.status,
      formatter: formatPercentage,
    },
    {
      label: 'LTV',
      yours: comparison.ltv.yours,
      average: comparison.ltv.average,
      percentile: comparison.ltv.percentile,
      status: comparison.ltv.status,
      formatter: formatCurrency,
    },
    {
      label: 'ARPU',
      yours: comparison.arpu.yours,
      average: comparison.arpu.average,
      percentile: comparison.arpu.percentile,
      status: comparison.arpu.status,
      formatter: formatCurrency,
    },
  ];
  
  return (
    <div className="whop-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--whop-text-primary)]">
              How You Compare
            </h2>
            <p className="text-xs text-[var(--whop-text-tertiary)]">
              {comparison.niche.charAt(0).toUpperCase() + comparison.niche.slice(1)} • {comparison.revenueRange}
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-[var(--whop-bg)] border border-[var(--whop-border)] rounded-lg">
          <p className="text-xs text-[var(--whop-text-secondary)]">
            vs {comparison.sampleSize} {comparison.sampleSize === 1 ? 'community' : 'communities'}
          </p>
        </div>
      </div>
      
      <div className="space-y-0">
        {metrics.map((metric) => (
          <BenchmarkRow key={metric.label} metric={metric} />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-400">
          💡 <strong>Tip:</strong> Benchmarks are anonymous and updated automatically. 
          Your data helps other creators compare their performance.
        </p>
      </div>
    </div>
  );
}
