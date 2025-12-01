import { differenceInDays, differenceInMonths } from 'date-fns';

interface MemberData {
  member: {
    id: string;
    createdAt: Date;
  };
  payments: Array<{
    status: string;
    amount: string;
    paymentDate: Date;
  }>;
  memberships: Array<{
    status: string;
    cancelAtPeriodEnd: boolean;
  }>;
  analytics?: {
    lifetimeMonths: number;
    lastPaymentAt: Date | null;
  };
}

export function calculateChurnRisk(memberData: MemberData): number {
  let riskScore = 0;

  const successfulPayments = memberData.payments.filter(p => p.status === 'succeeded');
  const hasAnyPayments = successfulPayments.length > 0;

  // No payments = high risk (40 points)
  if (!hasAnyPayments) {
    riskScore += 40;
  }

  // Failed payments increase risk (up to 30 points)
  const failedPayments = memberData.payments.filter(p => p.status === 'failed').length;
  riskScore += Math.min(failedPayments * 10, 30);

  // Days since last payment - use member creation date if no payments
  const lastPaymentDate = memberData.analytics?.lastPaymentAt || memberData.member.createdAt;
  const daysSinceLastPayment = differenceInDays(new Date(), new Date(lastPaymentDate));

  if (daysSinceLastPayment > 60) riskScore += 30;
  else if (daysSinceLastPayment > 45) riskScore += 25;
  else if (daysSinceLastPayment > 35) riskScore += 15;
  else if (daysSinceLastPayment > 30) riskScore += 10;

  // Canceled or canceling memberships
  const hasCanceled = memberData.memberships.some(m => m.status === 'cancelled' || m.status === 'canceled' || m.cancelAtPeriodEnd);
  if (hasCanceled) riskScore += 20;

  // Past due memberships indicate payment issues
  const hasPastDue = memberData.memberships.some(m => m.status === 'past_due');
  if (hasPastDue) riskScore += 25;

  // Expired memberships indicate churn
  const hasExpired = memberData.memberships.some(m => m.status === 'expired');
  if (hasExpired) riskScore += 15;

  // Declining payment amounts indicate potential churn
  if (hasAnyPayments && successfulPayments.length >= 4) {
    const sortedPayments = [...successfulPayments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const recentPayments = sortedPayments.slice(0, 2);
    const olderPayments = sortedPayments.slice(2, 4);

    const recentAvg = average(recentPayments.map(p => parseFloat(p.amount)));
    const olderAvg = average(olderPayments.map(p => parseFloat(p.amount)));
    if (recentAvg < olderAvg * 0.7) riskScore += 15;
  }

  // Short tenure = higher risk
  const tenureMonths = memberData.analytics?.lifetimeMonths || 0;
  if (tenureMonths < 1) riskScore += 10;
  else if (tenureMonths < 3) riskScore += 5;

  // Members with no active memberships are at high risk
  const hasActiveMembership = memberData.memberships.some(
    m => m.status === 'active' || m.status === 'trialing' || m.status === 'completed'
  );
  if (!hasActiveMembership && memberData.memberships.length > 0) {
    riskScore += 25;
  }

  return Math.min(Math.round(riskScore), 100);
}

export function calculateEngagementScore(memberData: MemberData): number {
  let engagementScore = 0;
  
  const successfulPayments = memberData.payments.filter(p => p.status === 'succeeded');
  const totalPayments = successfulPayments.length;
  
  if (totalPayments === 0) {
    return 0;
  }
  
  const expectedPayments = Math.max(memberData.analytics?.lifetimeMonths || 1, 1);
  const consistencyRate = Math.min(totalPayments / expectedPayments, 1);
  engagementScore += Math.round(consistencyRate * 40);
  
  const lastPaymentDate = memberData.analytics?.lastPaymentAt;
  if (lastPaymentDate) {
    const daysSinceLastPayment = differenceInDays(new Date(), new Date(lastPaymentDate));
    
    if (daysSinceLastPayment <= 7) engagementScore += 30;
    else if (daysSinceLastPayment <= 14) engagementScore += 25;
    else if (daysSinceLastPayment <= 21) engagementScore += 20;
    else if (daysSinceLastPayment <= 30) engagementScore += 15;
    else if (daysSinceLastPayment <= 45) engagementScore += 10;
  }
  
  const failedPayments = memberData.payments.filter(p => p.status === 'failed').length;
  const failureRate = failedPayments / Math.max(memberData.payments.length, 1);
  engagementScore += Math.round((1 - failureRate) * 15);
  
  const tenureMonths = memberData.analytics?.lifetimeMonths || 0;
  engagementScore += Math.min(tenureMonths * 2, 15);
  
  return Math.min(Math.round(engagementScore), 100);
}

export function getChurnRiskLabel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export function getChurnRiskColor(score: number): string {
  if (score >= 60) return 'red';
  if (score >= 30) return 'yellow';
  return 'green';
}

export function calculateTotalRevenue(payments: Array<{ status: string; amount: string }>): number {
  return payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
}

export function calculateAveragePayment(payments: Array<{ status: string; amount: string }>): number {
  const successfulPayments = payments.filter(p => p.status === 'succeeded');
  if (successfulPayments.length === 0) return 0;
  
  const total = successfulPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  return total / successfulPayments.length;
}

export function calculateLifetimeMonths(joinedAt: Date): number {
  return Math.max(differenceInMonths(new Date(), new Date(joinedAt)), 0);
}

export function getLastPaymentDate(payments: Array<{ status: string; paymentDate: Date }>): Date | null {
  const successfulPayments = payments
    .filter(p => p.status === 'succeeded')
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  
  return successfulPayments.length > 0 ? successfulPayments[0].paymentDate : null;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}
