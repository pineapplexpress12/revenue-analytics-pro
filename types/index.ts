export interface DashboardMetrics {
  mrr: number;
  mrrGrowth: number;
  totalRevenue: number;
  activeMembers: number;
  memberGrowth: number;
  churnRate: number;
  churnChange: number;
  ltv: number;
  arpu: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  mrr: number;
}

export interface MemberData {
  date: string;
  count: number;
  new: number;
  churned: number;
}

export interface PaymentAnalytics {
  totalPayments: number;
  successRate: number;
  failedCount: number;
  averageValue: number;
  methodBreakdown: Record<string, number>;
}

export interface CohortData {
  month: string;
  size: number;
  retention: Record<string, number>;
}

export interface ProductMetrics {
  id: string;
  name: string;
  revenue: number;
  members: number;
  churnRate: number;
}

export type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';
export type MetricTrend = 'up' | 'down' | 'neutral';
