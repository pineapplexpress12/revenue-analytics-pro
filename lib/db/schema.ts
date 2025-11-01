import { pgTable, text, timestamp, decimal, integer, boolean, jsonb, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Helper function for timestamps
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
};

// Companies table - represents Whop companies
export const companies = pgTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  whopCompanyId: text("whop_company_id").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  whopCompanyIdIdx: index("companies_whop_company_id_idx").on(table.whopCompanyId),
}));

// Products table - represents Whop products
export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  whopProductId: text("whop_product_id").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isApp: boolean("is_app").default(false).notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("products_company_id_idx").on(table.companyId),
  whopProductIdIdx: index("products_whop_product_id_idx").on(table.whopProductId),
  isAppIdx: index("products_is_app_idx").on(table.isApp),
}));

// Plans table - represents pricing plans for products
export const plans = pgTable("plans", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  whopPlanId: text("whop_plan_id").unique().notNull(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  billingPeriod: text("billing_period").notNull(), // "monthly", "yearly", "one_time", etc.
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  productIdIdx: index("plans_product_id_idx").on(table.productId),
  whopPlanIdIdx: index("plans_whop_plan_id_idx").on(table.whopPlanId),
}));

// Members table - represents customers/users
export const members = pgTable("members", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  whopUserId: text("whop_user_id").unique().notNull(),
  email: text("email"),
  username: text("username"),
  profilePictureUrl: text("profile_picture_url"),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("members_company_id_idx").on(table.companyId),
  whopUserIdIdx: index("members_whop_user_id_idx").on(table.whopUserId),
  emailIdx: index("members_email_idx").on(table.email),
}));

// Memberships table - represents active subscriptions
export const memberships = pgTable("memberships", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  planId: text("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  whopMembershipId: text("whop_membership_id").unique().notNull(),
  status: text("status").notNull(), // "active", "trialing", "cancelled", "expired", etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("memberships_company_id_idx").on(table.companyId),
  memberIdIdx: index("memberships_member_id_idx").on(table.memberId),
  productIdIdx: index("memberships_product_id_idx").on(table.productId),
  planIdIdx: index("memberships_plan_id_idx").on(table.planId),
  whopMembershipIdIdx: index("memberships_whop_membership_id_idx").on(table.whopMembershipId),
  statusIdx: index("memberships_status_idx").on(table.status),
}));

// Payments table - represents payment transactions
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  membershipId: text("membership_id").references(() => memberships.id, { onDelete: "cascade" }),
  memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  whopPaymentId: text("whop_payment_id").unique().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull(), // "succeeded", "pending", "failed", "refunded", etc.
  paymentDate: timestamp("payment_date").notNull(),
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("payments_company_id_idx").on(table.companyId),
  membershipIdIdx: index("payments_membership_id_idx").on(table.membershipId),
  memberIdIdx: index("payments_member_id_idx").on(table.memberId),
  whopPaymentIdIdx: index("payments_whop_payment_id_idx").on(table.whopPaymentId),
  statusIdx: index("payments_status_idx").on(table.status),
  paymentDateIdx: index("payments_payment_date_idx").on(table.paymentDate),
}));

// Metrics cache table - for caching computed analytics
export const metricsCache = pgTable("metrics_cache", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  metricType: text("metric_type").notNull(), // "mrr", "arr", "churn_rate", "ltv", etc.
  period: text("period").notNull(), // "daily", "weekly", "monthly", "yearly"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("metrics_cache_company_id_idx").on(table.companyId),
  metricTypeIdx: index("metrics_cache_metric_type_idx").on(table.metricType),
  periodIdx: index("metrics_cache_period_idx").on(table.period),
  periodStartIdx: index("metrics_cache_period_start_idx").on(table.periodStart),
  companyMetricPeriodIdx: index("metrics_cache_company_metric_period_idx").on(table.companyId, table.metricType, table.period, table.periodStart),
}));

// Sync logs table - for tracking data synchronization with Whop
export const syncLogs = pgTable("sync_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
  syncType: text("sync_type").notNull(), // "full", "incremental", "webhook"
  entityType: text("entity_type").notNull(), // "members", "memberships", "payments", etc.
  status: text("status").notNull(), // "started", "completed", "failed"
  recordsProcessed: integer("records_processed").default(0).notNull(),
  recordsFailed: integer("records_failed").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("sync_logs_company_id_idx").on(table.companyId),
  syncTypeIdx: index("sync_logs_sync_type_idx").on(table.syncType),
  entityTypeIdx: index("sync_logs_entity_type_idx").on(table.entityType),
  statusIdx: index("sync_logs_status_idx").on(table.status),
  startedAtIdx: index("sync_logs_started_at_idx").on(table.startedAt),
}));

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  products: many(products),
  members: many(members),
  memberships: many(memberships),
  payments: many(payments),
  metricsCache: many(metricsCache),
  syncLogs: many(syncLogs),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  plans: many(plans),
  memberships: many(memberships),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  product: one(products, {
    fields: [plans.productId],
    references: [products.id],
  }),
  memberships: many(memberships),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  company: one(companies, {
    fields: [members.companyId],
    references: [companies.id],
  }),
  memberships: many(memberships),
  payments: many(payments),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  company: one(companies, {
    fields: [memberships.companyId],
    references: [companies.id],
  }),
  member: one(members, {
    fields: [memberships.memberId],
    references: [members.id],
  }),
  product: one(products, {
    fields: [memberships.productId],
    references: [products.id],
  }),
  plan: one(plans, {
    fields: [memberships.planId],
    references: [plans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),
  membership: one(memberships, {
    fields: [payments.membershipId],
    references: [memberships.id],
  }),
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
}));

export const metricsCacheRelations = relations(metricsCache, ({ one }) => ({
  company: one(companies, {
    fields: [metricsCache.companyId],
    references: [companies.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  company: one(companies, {
    fields: [syncLogs.companyId],
    references: [companies.id],
  }),
}));

export const emailReportSettings = pgTable("email_report_settings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  frequency: text("frequency").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  lastSentAt: timestamp("last_sent_at"),
  nextScheduledAt: timestamp("next_scheduled_at"),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("email_report_settings_company_id_idx").on(table.companyId),
  frequencyIdx: index("email_report_settings_frequency_idx").on(table.frequency),
}));

export const emailReportSettingsRelations = relations(emailReportSettings, ({ one }) => ({
  company: one(companies, {
    fields: [emailReportSettings.companyId],
    references: [companies.id],
  }),
}));

// Member Analytics table - for member-level insights and scoring
export const memberAnalytics = pgTable("member_analytics", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  totalPayments: integer("total_payments").default(0).notNull(),
  averagePayment: decimal("average_payment", { precision: 10, scale: 2 }).default("0").notNull(),
  lifetimeMonths: integer("lifetime_months").default(0).notNull(),
  lastPaymentAt: timestamp("last_payment_at"),
  churnRiskScore: integer("churn_risk_score").default(0).notNull(), // 0-100, higher = more likely to churn
  engagementScore: integer("engagement_score").default(0).notNull(), // 0-100, higher = more engaged
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  ...timestamps,
}, (table) => ({
  companyIdIdx: index("member_analytics_company_id_idx").on(table.companyId),
  memberIdIdx: index("member_analytics_member_id_idx").on(table.memberId),
  churnRiskIdx: index("member_analytics_churn_risk_idx").on(table.churnRiskScore),
  companyMemberUnique: unique("member_analytics_company_member_unique").on(table.companyId, table.memberId),
}));

export const memberAnalyticsRelations = relations(memberAnalytics, ({ one }) => ({
  company: one(companies, {
    fields: [memberAnalytics.companyId],
    references: [companies.id],
  }),
  member: one(members, {
    fields: [memberAnalytics.memberId],
    references: [members.id],
  }),
}));

export const benchmarkData = pgTable("benchmark_data", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  niche: text("niche").notNull(),
  revenueRange: text("revenue_range").notNull(),
  avgMrr: decimal("avg_mrr", { precision: 10, scale: 2 }).notNull(),
  avgChurnRate: decimal("avg_churn_rate", { precision: 5, scale: 2 }).notNull(),
  avgLtv: decimal("avg_ltv", { precision: 10, scale: 2 }).notNull(),
  avgArpu: decimal("avg_arpu", { precision: 10, scale: 2 }).notNull(),
  sampleSize: integer("sample_size").notNull(),
  contributingCompanies: jsonb("contributing_companies").default([]).notNull(),
  ...timestamps,
}, (table) => ({
  nicheIdx: index("benchmark_data_niche_idx").on(table.niche),
  revenueRangeIdx: index("benchmark_data_revenue_range_idx").on(table.revenueRange),
  nicheRangeIdx: index("benchmark_data_niche_range_idx").on(table.niche, table.revenueRange),
}));

