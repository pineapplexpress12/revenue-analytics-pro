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
  
  // Factor 1: Payment failures (up to 30 points)
  const failedPayments = memberData.payments.filter(p => p.status === 'failed').length;
  riskScore += Math.min(failedPayments * 10, 30);
  
  // Factor 2: Time since last payment (up to 25 points)
  const lastPaymentDate = memberData.analytics?.lastPaymentAt || memberData.member.createdAt;
  const daysSinceLastPayment = differenceInDays(new Date(), new Date(lastPaymentDate));
  
  if (daysSinceLastPayment > 45) riskScore += 25;
  else if (daysSinceLastPayment > 35) riskScore += 15;
  else if (daysSinceLastPayment > 30) riskScore += 10;
  
  // Factor 3: Membership status (up to 20 points)
  const hasCanceled = memberData.memberships.some(m => m.cancelAtPeriodEnd);
  if (hasCanceled) riskScore += 20;
  
  // Factor 4: Declining payment amounts (up to 15 points)
  const successfulPayments = memberData.payments
    .filter(p => p.status === 'succeeded')
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  
  const recentPayments = successfulPayments.slice(0, 3);
  const olderPayments = successfulPayments.slice(3, 6);
  
  if (recentPayments.length && olderPayments.length) {
    const recentAvg = average(recentPayments.map(p => parseFloat(p.amount)));
    const olderAvg = average(olderPayments.map(p => parseFloat(p.amount)));
    if (recentAvg < olderAvg * 0.8) riskScore += 15;
  }
  
  // Factor 5: Short tenure (up to 10 points)
  const tenureMonths = memberData.analytics?.lifetimeMonths || 0;
  if (tenureMonths < 2) riskScore += 10;
  else if (tenureMonths < 4) riskScore += 5;
  
  return Math.min(Math.round(riskScore), 100);
}

export function calculateEngagementScore(memberData: MemberData): number {
  let engagementScore = 0;
  
  // Factor 1: Payment consistency (up to 40 points)
  const totalPayments = memberData.payments.filter(p => p.status === 'succeeded').length;
  const expectedPayments = memberData.analytics?.lifetimeMonths || 1;
  const consistencyRate = totalPayments / Math.max(expectedPayments, 1);
  engagementScore += Math.min(consistencyRate * 40, 40);
  
  // Factor 2: Recent activity (up to 30 points)
  const lastPaymentDate = memberData.analytics?.lastPaymentAt || memberData.member.createdAt;
  const daysSinceLastPayment = differenceInDays(new Date(), new Date(lastPaymentDate));
  
  if (daysSinceLastPayment < 7) engagementScore += 30;
  else if (daysSinceLastPayment < 14) engagementScore += 20;
  else if (daysSinceLastPayment < 30) engagementScore += 10;
  
  // Factor 3: No failed payments (up to 15 points)
  const failureRate = memberData.payments.filter(p => p.status === 'failed').length / 
                      Math.max(memberData.payments.length, 1);
  engagementScore += Math.round((1 - failureRate) * 15);
  
  // Factor 4: Tenure (up to 15 points)
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
