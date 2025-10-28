'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  AlertCircle,
  DollarSign,
  Users,
  TrendingDown,
  Loader2,
  LayoutDashboard,
  UserCircle,
  CreditCard,
  Mail,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface FailedPaymentsClientProps {
  companyId: string;
  experienceId: string;
}

interface FailedPayment {
  id: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  status: string;
  whopPaymentId: string;
  member: {
    id: string;
    whopUserId: string;
    email: string | null;
    username: string | null;
    profilePictureUrl: string | null;
  } | null;
}

interface Stats {
  totalFailed: number;
  totalAmount: number;
  uniqueMembers: number;
  recentFailures: number;
}

export function FailedPaymentsClient({ companyId, experienceId }: FailedPaymentsClientProps) {
  const [payments, setPayments] = useState<FailedPayment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFailedPayments();
  }, [companyId]);

  async function fetchFailedPayments() {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/failed?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch failed payments:', error);
    } finally {
      setLoading(false);
    }
  }

  function getRecoveryRecommendation(payment: FailedPayment): string {
    if (!payment.member) return 'Member data unavailable';
    
    const daysSinceFailure = Math.floor(
      (new Date().getTime() - new Date(payment.paymentDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceFailure <= 3) {
      return 'Send immediate payment reminder email';
    } else if (daysSinceFailure <= 7) {
      return 'Offer payment plan or alternative payment method';
    } else if (daysSinceFailure <= 14) {
      return 'Final notice before membership suspension';
    } else {
      return 'Consider account suspension or win-back campaign';
    }
  }

  function getRecommendationIcon(recommendation: string) {
    if (recommendation.includes('immediate')) return Mail;
    if (recommendation.includes('payment plan')) return DollarSign;
    if (recommendation.includes('Final notice')) return AlertCircle;
    return RefreshCw;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--whop-accent)]" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
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
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-transparent text-[var(--whop-text-secondary)] hover:text-[var(--whop-text-primary)] hover:border-gray-600 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              Members
            </Link>
            <Link
              href={`/experiences/${experienceId}/failed-payments`}
              className="flex items-center gap-2 px-1 py-3 border-b-2 border-[var(--whop-accent)] text-[var(--whop-accent)] font-medium"
            >
              <CreditCard className="h-4 w-4" />
              Failed Payments
            </Link>
          </nav>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--whop-text-primary)]">Failed Payments</h1>
            <p className="text-[var(--whop-text-secondary)] mt-1">
              Recover lost revenue with automated recovery recommendations
            </p>
          </div>
        </div>
        
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Failed"
              value={stats.totalFailed}
              icon={AlertCircle}
              trend="down"
            />
            <MetricCard
              title="Lost Revenue"
              value={stats.totalAmount.toFixed(2)}
              prefix="$"
              icon={DollarSign}
              trend="down"
            />
            <MetricCard
              title="Affected Members"
              value={stats.uniqueMembers}
              icon={Users}
            />
            <MetricCard
              title="Last 30 Days"
              value={stats.recentFailures}
              icon={TrendingDown}
              trend="down"
            />
          </div>
        )}
        
        {payments.length === 0 ? (
          <div className="whop-card text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--whop-text-primary)] mb-2">
              No Failed Payments
            </h3>
            <p className="text-[var(--whop-text-secondary)]">
              Great job! All your payments are processing successfully.
            </p>
          </div>
        ) : (
          <div className="whop-card">
            <h2 className="text-xl font-semibold text-[var(--whop-text-primary)] mb-4">
              Failed Payments & Recovery Actions
            </h2>
            <div className="space-y-4">
              {payments.map((payment) => {
                const displayName = payment.member?.username || payment.member?.email || 'Unknown User';
                const recommendation = getRecoveryRecommendation(payment);
                const RecommendationIcon = getRecommendationIcon(recommendation);
                
                return (
                  <div
                    key={payment.id}
                    className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)] hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {payment.member?.profilePictureUrl ? (
                              <img
                                src={payment.member.profilePictureUrl}
                                alt={displayName}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/experiences/${experienceId}/members/${payment.member?.id}`}
                                className="font-semibold text-[var(--whop-text-primary)] hover:text-[var(--whop-accent)] transition-colors"
                              >
                                {displayName}
                              </Link>
                              {payment.member?.email && (
                                <p className="text-xs text-[var(--whop-text-tertiary)]">
                                  {payment.member.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[var(--whop-text-secondary)]">
                              Failed on {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                            </span>
                            <span className="font-semibold text-red-400">
                              ${payment.amount.toFixed(2)} {payment.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                        <RecommendationIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">{recommendation}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="whop-card">
          <h2 className="text-xl font-semibold text-[var(--whop-text-primary)] mb-4">
            Recovery Best Practices
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--whop-text-primary)] mb-1">
                    Immediate Follow-up
                  </h3>
                  <p className="text-sm text-[var(--whop-text-secondary)]">
                    Send payment reminder within 24 hours. Often failures are due to expired cards or insufficient funds.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--whop-text-primary)] mb-1">
                    Payment Plans
                  </h3>
                  <p className="text-sm text-[var(--whop-text-secondary)]">
                    For larger amounts, offer payment plans or alternative payment methods to make it easier for members to pay.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--whop-text-primary)] mb-1">
                    Grace Periods
                  </h3>
                  <p className="text-sm text-[var(--whop-text-secondary)]">
                    Provide a 7-14 day grace period before suspending access. This maintains goodwill while encouraging payment.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--whop-text-primary)] mb-1">
                    Automated Retry
                  </h3>
                  <p className="text-sm text-[var(--whop-text-secondary)]">
                    Configure automatic retry attempts over several days. Many payment issues resolve themselves with retries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
