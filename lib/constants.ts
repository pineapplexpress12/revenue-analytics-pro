export const METRIC_TYPES = {
  MRR: 'mrr',
  REVENUE: 'revenue',
  CHURN: 'churn',
  LTV: 'ltv',
  ARPU: 'arpu',
  MEMBER_COUNT: 'member_count',
} as const;

export const SYNC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;

export const PAYMENT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  revenue: '#8b5cf6',
  members: '#3b82f6',
  churn: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
} as const;
