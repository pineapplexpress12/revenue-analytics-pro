'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';

interface MemberFiltersProps {
  onFilterChange: (filters: { sortBy: string; filterRisk: string }) => void;
}

export function MemberFilters({ onFilterChange }: MemberFiltersProps) {
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [filterRisk, setFilterRisk] = useState('all');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onFilterChange({ sortBy: value, filterRisk });
  };

  const handleRiskChange = (value: string) => {
    setFilterRisk(value);
    onFilterChange({ sortBy, filterRisk: value });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--whop-text-secondary)]" />
        <span className="text-sm text-[var(--whop-text-secondary)]">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 bg-[var(--whop-card-bg)] border border-[var(--whop-border)] rounded-lg text-[var(--whop-text-primary)] text-sm font-medium hover:border-gray-600 transition-colors"
        >
          <option value="totalRevenue">Total Revenue</option>
          <option value="churnRisk">Churn Risk</option>
          <option value="recent">Recently Joined</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--whop-text-secondary)]">Risk:</span>
        <select
          value={filterRisk}
          onChange={(e) => handleRiskChange(e.target.value)}
          className="px-3 py-2 bg-[var(--whop-card-bg)] border border-[var(--whop-border)] rounded-lg text-[var(--whop-text-primary)] text-sm font-medium hover:border-gray-600 transition-colors"
        >
          <option value="all">All Members</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>
    </div>
  );
}
