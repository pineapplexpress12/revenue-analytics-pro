'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MemberCard } from '@/components/members/MemberCard';
import { MemberFilters } from '@/components/members/MemberFilters';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Search, Users, AlertCircle, Crown, Activity, Loader2, LayoutDashboard, UserCircle, CreditCard } from 'lucide-react';

interface MembersClientProps {
  companyId: string;
  experienceId: string;
}

interface Member {
  id: string;
  whopUserId: string;
  email: string | null;
  username: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  analytics: {
    totalRevenue: number;
    totalPayments: number;
    averagePayment: number;
    lifetimeMonths: number;
    lastPaymentAt: Date | null;
    churnRiskScore: number;
    engagementScore: number;
    calculatedAt: Date;
  } | null;
}

export function MembersClient({ companyId, experienceId }: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [filterRisk, setFilterRisk] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMembers();
  }, [companyId, search, sortBy, filterRisk, page]);

  async function fetchMembers() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId,
        page: page.toString(),
        sortBy,
        filterRisk,
        ...(search && { search }),
      });

      const response = await fetch(`/api/members/list?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (filters: { sortBy: string; filterRisk: string }) => {
    setSortBy(filters.sortBy);
    setFilterRisk(filters.filterRisk);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Calculate stats
  const totalMembers = members.length;
  const atRiskMembers = members.filter(m => m.analytics && m.analytics.churnRiskScore >= 60).length;
  const vipMembers = Math.ceil(totalMembers * 0.1); // Top 10%
  const avgEngagement = members.reduce((sum, m) => sum + (m.analytics?.engagementScore || 0), 0) / (totalMembers || 1);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-[var(--whop-border)]">
          <nav className="flex gap-6">
            <Link
              href={`/experiences/${experienceId}`}
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-transparent text-[var(--whop-text-secondary)] hover:text-[var(--whop-text-primary)] hover:border-gray-600 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href={`/experiences/${experienceId}/members`}
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-[var(--whop-accent)] text-[var(--whop-accent)] font-medium"
            >
              <UserCircle className="h-4 w-4" />
              Members
            </Link>
            <Link
              href={`/experiences/${experienceId}/failed-payments`}
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-transparent text-[var(--whop-text-secondary)] hover:text-[var(--whop-text-primary)] hover:border-gray-600 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Failed Payments
            </Link>
          </nav>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--whop-text-primary)]">Members</h1>
            <p className="text-[var(--whop-text-secondary)] mt-1">
              Individual member insights and churn risk analysis
            </p>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Members"
            value={totalMembers}
            icon={Users}
          />
          <MetricCard
            title="At Risk"
            value={atRiskMembers}
            trend={atRiskMembers > 0 ? 'down' : 'neutral'}
            icon={AlertCircle}
          />
          <MetricCard
            title="VIP Members"
            value={vipMembers}
            description="Top 10% by revenue"
            icon={Crown}
          />
          <MetricCard
            title="Avg Engagement"
            value={Math.round(avgEngagement)}
            suffix="/100"
            icon={Activity}
          />
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--whop-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search members by email or username..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--whop-card-bg)] border border-[var(--whop-border)] rounded-lg text-[var(--whop-text-primary)] placeholder-[var(--whop-text-tertiary)] focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
          <MemberFilters onFilterChange={handleFilterChange} />
        </div>
        
        {/* Members List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--whop-accent)]" />
          </div>
        ) : members.length === 0 ? (
          <div className="whop-card text-center py-12">
            <Users className="h-12 w-12 text-[var(--whop-text-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--whop-text-primary)] mb-2">
              No members found
            </h3>
            <p className="text-[var(--whop-text-secondary)]">
              {search ? 'Try a different search term' : 'Your members will appear here once they join'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                companyId={experienceId}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[var(--whop-card-bg)] border border-[var(--whop-border)] rounded-lg text-[var(--whop-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-[var(--whop-text-secondary)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[var(--whop-card-bg)] border border-[var(--whop-border)] rounded-lg text-[var(--whop-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
