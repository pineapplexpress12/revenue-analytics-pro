'use client';

import { BarChart3, Users } from 'lucide-react';

interface NoBenchmarkCardProps {
  niche: string;
  revenueRange: string;
}

export function NoBenchmarkCard({ niche, revenueRange }: NoBenchmarkCardProps) {
  return (
    <div className="whop-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-500/20 rounded-lg">
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--whop-text-primary)]">
            Benchmarking
          </h2>
          <p className="text-xs text-[var(--whop-text-tertiary)]">
            {niche.charAt(0).toUpperCase() + niche.slice(1)} • {revenueRange}
          </p>
        </div>
      </div>
      
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-[var(--whop-text-tertiary)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--whop-text-primary)] mb-2">
          Not Enough Data Yet
        </h3>
        <p className="text-sm text-[var(--whop-text-secondary)] mb-4">
          We need more communities in your niche and revenue range to provide meaningful benchmarks.
        </p>
        <p className="text-xs text-[var(--whop-text-tertiary)]">
          Your anonymous data is being collected to help build these benchmarks. Check back soon!
        </p>
      </div>
    </div>
  );
}
