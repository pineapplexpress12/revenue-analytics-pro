'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { getChurnRiskLabel } from '@/lib/analytics/member-scoring';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Activity,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  CreditCard,
} from 'lucide-react';

interface MemberProfileClientProps {
  companyId: string;
  memberId: string;
  experienceId: string;
}

export function MemberProfileClient({ companyId, memberId, experienceId }: MemberProfileClientProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [companyId, memberId]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/profile?memberId=${memberId}&companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch member profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--whop-accent)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--whop-text-primary)] mb-2">
            Member Not Found
          </h1>
          <p className="text-[var(--whop-text-secondary)]">
            This member could not be found
          </p>
        </div>
      </div>
    );
  }

  const displayName = profile.username || profile.email || 'Unknown User';
  const riskLevel = profile.analytics ? getChurnRiskLabel(profile.analytics.churnRiskScore) : 'Low';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={`/experiences/${experienceId}/members`}
          className="inline-flex items-center gap-2 text-[var(--whop-text-secondary)] hover:text-[var(--whop-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>

        {/* Header with member info */}
        <div className="whop-card">
          <div className="flex items-center gap-6">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--whop-text-primary)]">{displayName}</h1>
              {profile.email && (
                <p className="text-[var(--whop-text-secondary)] mt-1">{profile.email}</p>
              )}
            </div>
            {profile.analytics && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                riskLevel === 'High' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : riskLevel === 'Medium'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {riskLevel === 'High' && <AlertCircle className="w-4 h-4" />}
                {riskLevel === 'Low' && <CheckCircle className="w-4 h-4" />}
                Churn Risk: {profile.analytics.churnRiskScore}/100
              </div>
            )}
          </div>
        </div>
        
        {/* Key Metrics */}
        {profile.analytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value={profile.totalRevenue.toFixed(2)}
              prefix="$"
              icon={DollarSign}
            />
            <MetricCard
              title="Lifetime Value"
              value={profile.lifetimeValue.toFixed(2)}
              prefix="$"
              icon={TrendingUp}
            />
            <MetricCard
              title="Member For"
              value={`${profile.analytics.lifetimeMonths} mo`}
              icon={Calendar}
            />
            <MetricCard
              title="Engagement Score"
              value={`${profile.analytics.engagementScore}/100`}
              icon={Activity}
            />
          </div>
        )}
        
        {/* Active Memberships */}
        {profile.activeMemberships && profile.activeMemberships.length > 0 && (
          <div className="whop-card">
            <h2 className="text-xl font-semibold text-[var(--whop-text-primary)] mb-4">
              Active Memberships
            </h2>
            <div className="space-y-3">
              {profile.activeMemberships.map((membership: any) => (
                <div
                  key={membership.id}
                  className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--whop-text-primary)]">
                        {membership.productName}
                      </h3>
                      <p className="text-sm text-[var(--whop-text-secondary)] mt-1">
                        {membership.planName} • ${membership.price}/{membership.currency}
                      </p>
                      <p className="text-xs text-[var(--whop-text-tertiary)] mt-1">
                        Started {format(new Date(membership.startDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      membership.cancelAtPeriodEnd
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {membership.cancelAtPeriodEnd ? 'Canceling' : 'Active'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Payment History */}
        {profile.paymentHistory && profile.paymentHistory.length > 0 && (
          <div className="whop-card">
            <h2 className="text-xl font-semibold text-[var(--whop-text-primary)] mb-4">
              Payment History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--whop-border)]">
                    <th className="text-left py-3 px-2 text-sm font-medium text-[var(--whop-text-secondary)]">Date</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-[var(--whop-text-secondary)]">Amount</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-[var(--whop-text-secondary)]">Status</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-[var(--whop-text-secondary)]">Refunded</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.paymentHistory.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-[var(--whop-border)]">
                      <td className="py-3 px-2 text-sm text-[var(--whop-text-primary)]">
                        {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-2 text-sm text-[var(--whop-text-primary)] font-medium">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'succeeded'
                            ? 'bg-green-500/20 text-green-400'
                            : payment.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {payment.status === 'succeeded' && <CheckCircle className="w-3 h-3" />}
                          {payment.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-[var(--whop-text-secondary)]">
                        {payment.refundedAmount > 0 ? `$${payment.refundedAmount.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Timeline */}
        {profile.timeline && profile.timeline.length > 0 && (
          <div className="whop-card">
            <h2 className="text-xl font-semibold text-[var(--whop-text-primary)] mb-4">
              Activity Timeline
            </h2>
            <div className="space-y-4">
              {profile.timeline.slice(0, 10).map((event: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.type === 'payment' && event.status === 'succeeded'
                        ? 'bg-green-500/20'
                        : event.type === 'payment' && event.status === 'failed'
                        ? 'bg-red-500/20'
                        : 'bg-blue-500/20'
                    }`}>
                      {event.type === 'payment' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    {index < profile.timeline.slice(0, 10).length - 1 && (
                      <div className="w-0.5 h-full bg-[var(--whop-border)] mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-sm font-medium text-[var(--whop-text-primary)]">
                      {event.description}
                    </p>
                    {event.amount && (
                      <p className="text-sm text-[var(--whop-text-secondary)] mt-1">
                        ${event.amount.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-[var(--whop-text-tertiary)] mt-1">
                      {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
