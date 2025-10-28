# Revenue Analytics Dashboard - Whop App Specification

## 🚀 Quick Setup Summary for Claude Code

**What we're building:** The ONLY revenue analytics dashboard for Whop creators (zero competition!)

**Complete Tech Stack:**
- Next.js 14 + TypeScript (already set up)
- Drizzle ORM + Supabase PostgreSQL (for database)
- Tailwind CSS + shadcn/ui (for UI)
- Lucide React (for icons)
- Recharts (for charts)
- @whop/api SDK (already installed via `npx mint-mcp add whop`)

**What's already configured:**
✅ Whop integration
✅ Supabase database  
✅ Vercel deployment
✅ GitHub repo

**What needs to be built:**
1. Database schema with Drizzle ORM (8 tables)
2. Data sync system (initial + incremental)
3. Metric calculation functions (MRR, churn, LTV, etc.)
4. Dashboard UI with charts
5. API routes for metrics
6. Webhook handlers

**Build order:**
1. Set up Drizzle schema and push to database
2. Create data sync functions
3. Build metric calculation logic
4. Create API routes
5. Build UI components
6. Connect everything together

---

## Project Overview

**App Name:** Revenue Analytics Pro  
**Purpose:** Comprehensive revenue, member, and payment analytics for Whop creators  
**Target Users:** Whop creators selling courses, coaching, and paid communities  
**Unique Value:** The ONLY analytics app in the Whop ecosystem - zero competition

## Why This Will Succeed

1. **Zero Competition** - No analytics apps currently exist on Whop
2. **Universal Need** - Every serious creator needs revenue insights (19,002 use Courses app, 16,131 use Files)
3. **High Value** - Data = better decisions = easy to charge $49-149/month
4. **Sticky** - Historical data creates lock-in effect
5. **Clear ROI** - "Know your numbers = grow your business"

---

## Tech Stack (Already Set Up)

- **Framework:** Next.js 14 + TypeScript
- **Database:** Supabase (PostgreSQL) + Drizzle ORM
- **Deployment:** Vercel
- **Version Control:** GitHub
- **Whop Integration:** @whop/api SDK (already installed)
- **UI Components:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** React Query (TanStack Query)
- **Date Utilities:** date-fns
- **Validation:** Zod

---

## Required Packages

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.3.0",
    "@whop/api": "latest",
    "drizzle-orm": "^0.29.0",
    "@supabase/supabase-js": "^2.39.0",
    "postgres": "^3.4.3",
    "@tanstack/react-query": "^5.17.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.344.0",
    "date-fns": "^3.3.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0"
  }
}
```

### Installation Command
```bash
npm install @whop/api drizzle-orm @supabase/supabase-js postgres @tanstack/react-query recharts lucide-react date-fns zod class-variance-authority clsx tailwind-merge

npm install -D drizzle-kit
```

---

## Drizzle Configuration

### Setup Files

#### `drizzle.config.ts`
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

#### `lib/db/client.ts`
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it's not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

---

## shadcn/ui & Tailwind Setup

### Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

When prompted, choose:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config: Yes
- Components: `@/components`
- Utils: `@/lib/utils`
- React Server Components: Yes

### Install Required shadcn/ui Components

```bash
# Core UI components for the dashboard
npx shadcn-ui@latest add button card table badge avatar
npx shadcn-ui@latest add select dropdown-menu dialog tooltip
npx shadcn-ui@latest add separator skeleton scroll-area tabs
npx shadcn-ui@latest add input label
```

### Tailwind Configuration

Your `tailwind.config.ts` should look like this:

```typescript
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

---

## Core Features (MVP)

### 1. Dashboard Overview
Display key metrics at a glance:
- Monthly Recurring Revenue (MRR)
- Total Revenue (all-time, this month, last month)
- Active Members count
- Churn Rate
- Average Lifetime Value (LTV)
- Revenue Per User (ARPU)

### 2. Revenue Analytics
- Revenue over time chart (daily/weekly/monthly views)
- Revenue growth rate (MoM, YoY)
- Revenue by product/plan breakdown
- Payment success vs failure rates
- Refund tracking

### 3. Member Analytics
- Total members (active, churned, all-time)
- New members this month
- Member growth chart over time
- Member acquisition trends
- Retention rate

### 4. Payment Analytics
- Total payments processed
- Average transaction value
- Payment method breakdown
- Failed payment count and recovery opportunities
- Payment success rate

### 5. Cohort Analysis
- Monthly cohort retention table
- Member lifetime by cohort
- Revenue by cohort

### 6. Product Performance
- Revenue by each product
- Member count per product
- Conversion rates by product
- Churn rate by product

---

## Database Schema (Drizzle ORM)

### Complete Schema File

Create `lib/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, integer, numeric, boolean, jsonb, serial, date, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Companies Table
export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().unique(),
  companyName: text("company_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status").default("pending"),
  settings: jsonb("settings").default({})
});

// Memberships Table
export const memberships = pgTable("memberships", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  membershipId: text("membership_id").notNull().unique(),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull(),
  valid: boolean("valid").default(false),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at"),
  renewalPeriodStart: timestamp("renewal_period_start"),
  renewalPeriodEnd: timestamp("renewal_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  quantity: integer("quantity").default(1),
  metadata: jsonb("metadata"),
  syncedAt: timestamp("synced_at").defaultNow()
}, (table) => ({
  companyIdx: index("idx_memberships_company").on(table.companyId),
  statusIdx: index("idx_memberships_status").on(table.status),
  userIdx: index("idx_memberships_user").on(table.userId),
  createdIdx: index("idx_memberships_created").on(table.createdAt)
}));

// Payments Table
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  paymentId: text("payment_id").notNull().unique(),
  membershipId: text("membership_id"),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull(),
  planId: text("plan_id"),
  status: text("status").notNull(),
  subtotal: integer("subtotal").notNull(),
  finalAmount: integer("final_amount").notNull(),
  currency: text("currency").default("usd"),
  refundedAmount: integer("refunded_amount").default(0),
  createdAt: timestamp("created_at").notNull(),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  cardBrand: text("card_brand"),
  fundingMethod: text("funding_method"),
  syncedAt: timestamp("synced_at").defaultNow()
}, (table) => ({
  companyIdx: index("idx_payments_company").on(table.companyId),
  statusIdx: index("idx_payments_status").on(table.status),
  createdIdx: index("idx_payments_created").on(table.createdAt),
  userIdx: index("idx_payments_user").on(table.userId)
}));

// Products Table
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  productId: text("product_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  visibility: text("visibility"),
  createdAt: timestamp("created_at").notNull(),
  syncedAt: timestamp("synced_at").defaultNow()
}, (table) => ({
  companyIdx: index("idx_products_company").on(table.companyId)
}));

// Plans Table
export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  planId: text("plan_id").notNull().unique(),
  productId: text("product_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").default("usd"),
  interval: text("interval").notNull(),
  intervalCount: integer("interval_count").default(1),
  createdAt: timestamp("created_at").notNull(),
  syncedAt: timestamp("synced_at").defaultNow()
}, (table) => ({
  companyIdx: index("idx_plans_company").on(table.companyId),
  productIdx: index("idx_plans_product").on(table.productId)
}));

// Members Table
export const members = pgTable("members", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  memberId: text("member_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username"),
  email: text("email"),
  name: text("name"),
  status: text("status"),
  joinedAt: timestamp("joined_at"),
  syncedAt: timestamp("synced_at").defaultNow()
}, (table) => ({
  companyIdx: index("idx_members_company").on(table.companyId),
  userIdx: index("idx_members_user").on(table.userId),
  uniqueMember: uniqueIndex("unique_company_member").on(table.companyId, table.memberId)
}));

// Metrics Cache Table
export const metricsCache = pgTable("metrics_cache", {
  id: serial("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  metricType: text("metric_type").notNull(),
  metricValue: numeric("metric_value"),
  metricData: jsonb("metric_data"),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow()
}, (table) => ({
  companyIdx: index("idx_metrics_company").on(table.companyId),
  typeIdx: index("idx_metrics_type").on(table.metricType),
  periodIdx: index("idx_metrics_period").on(table.periodStart, table.periodEnd),
  uniqueMetric: uniqueIndex("unique_company_metric_period")
    .on(table.companyId, table.metricType, table.periodStart, table.periodEnd)
}));

// Sync Logs Table
export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.companyId),
  syncType: text("sync_type").notNull(),
  status: text("status").notNull(),
  recordsSynced: integer("records_synced").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms")
}, (table) => ({
  companyIdx: index("idx_sync_logs_company").on(table.companyId),
  startedIdx: index("idx_sync_logs_started").on(table.startedAt)
}));

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  memberships: many(memberships),
  payments: many(payments),
  products: many(products),
  plans: many(plans),
  members: many(members),
  metricsCache: many(metricsCache),
  syncLogs: many(syncLogs)
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  company: one(companies, {
    fields: [memberships.companyId],
    references: [companies.companyId]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.companyId]
  })
}));

// Type exports for use in application
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type MetricCache = typeof metricsCache.$inferSelect;
export type NewMetricCache = typeof metricsCache.$inferInsert;

export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
```

### Generate and Run Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate:pg

# Push to database (for development)
npx drizzle-kit push:pg

# Or run migrations (for production)
npx drizzle-kit migrate
```

### Database Query Examples with Drizzle

```typescript
import { db } from "@/lib/db/client";
import { memberships, payments, companies } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// Get all active memberships for a company
const activeMemberships = await db
  .select()
  .from(memberships)
  .where(
    and(
      eq(memberships.companyId, companyId),
      eq(memberships.status, "active")
    )
  );

// Get payments with date range
const recentPayments = await db
  .select()
  .from(payments)
  .where(
    and(
      eq(payments.companyId, companyId),
      gte(payments.createdAt, startDate),
      lte(payments.createdAt, endDate)
    )
  )
  .orderBy(desc(payments.createdAt));

// Insert new membership
await db.insert(memberships).values({
  id: data.id,
  companyId: data.company_id,
  membershipId: data.membership_id,
  userId: data.user_id,
  productId: data.product_id,
  planId: data.plan_id,
  status: data.status,
  valid: data.valid,
  createdAt: new Date(data.created_at),
  expiresAt: data.expires_at ? new Date(data.expires_at) : null,
});

// Update membership status
await db
  .update(memberships)
  .set({ status: "canceled", valid: false })
  .where(eq(memberships.membershipId, membershipId));

// Complex query with joins
const membershipWithPayments = await db
  .select({
    membership: memberships,
    payment: payments
  })
  .from(memberships)
  .leftJoin(payments, eq(memberships.membershipId, payments.membershipId))
  .where(eq(memberships.companyId, companyId));
```

---

## API Routes to Build

### Authentication & Setup

#### `POST /api/whop/auth`
Handle Whop OAuth callback and store credentials
- Verify Whop access token
- Store company info in database
- Trigger initial data sync

#### `POST /api/sync/initial`
Perform initial data synchronization
- Fetch all memberships from Whop API
- Fetch all payments
- Fetch products and plans
- Fetch members
- Store in Supabase
- Calculate initial metrics

### Data Sync

#### `POST /api/sync/incremental`
Daily incremental sync (run via Vercel Cron)
- Fetch new memberships since last sync
- Fetch new payments
- Update changed records
- Recalculate metrics

#### `POST /api/webhooks/whop`
Handle Whop webhooks for real-time updates
- `membership.went_valid` - New member
- `membership.went_invalid` - Churned member
- `payment.succeeded` - Successful payment
- `payment.failed` - Failed payment
- Update database
- Invalidate metric cache

### Metrics API

#### `GET /api/metrics/overview?companyId={id}`
Return dashboard overview metrics
```json
{
  "mrr": 12450,
  "mrrGrowth": 8.2,
  "totalRevenue": 87320,
  "activeMembers": 342,
  "memberGrowth": 12,
  "churnRate": 4.2,
  "churnChange": -0.8,
  "ltv": 287,
  "arpu": 36.42
}
```

#### `GET /api/metrics/revenue?companyId={id}&period={month|year}`
Return revenue time series data
```json
{
  "data": [
    { "date": "2025-01", "revenue": 10500, "mrr": 9800 },
    { "date": "2025-02", "revenue": 11200, "mrr": 10300 }
  ],
  "growth": 6.7
}
```

#### `GET /api/metrics/members?companyId={id}`
Return member analytics
```json
{
  "total": 342,
  "active": 315,
  "churned": 27,
  "newThisMonth": 45,
  "timeline": [
    { "date": "2025-01", "count": 297 },
    { "date": "2025-02", "count": 342 }
  ]
}
```

#### `GET /api/metrics/payments?companyId={id}`
Return payment analytics
```json
{
  "totalPayments": 1250,
  "successRate": 95.6,
  "failedCount": 55,
  "averageValue": 47.50,
  "methodBreakdown": {
    "card": 1100,
    "paypal": 150
  }
}
```

#### `GET /api/metrics/cohorts?companyId={id}`
Return cohort retention data
```json
{
  "cohorts": [
    {
      "month": "2025-01",
      "size": 50,
      "retention": {
        "month_0": 100,
        "month_1": 88,
        "month_2": 76
      }
    }
  ]
}
```

#### `GET /api/metrics/products?companyId={id}`
Return product performance metrics
```json
{
  "products": [
    {
      "id": "prod_xxx",
      "name": "Premium Course",
      "revenue": 25000,
      "members": 150,
      "churnRate": 3.5
    }
  ]
}
```

---

## Core Business Logic Functions

### Metric Calculations

#### Calculate MRR (Monthly Recurring Revenue)
```typescript
async function calculateMRR(companyId: string): Promise<number> {
  // Get all active memberships
  const memberships = await getActiveMemberships(companyId);
  
  let mrr = 0;
  
  for (const membership of memberships) {
    const plan = await getPlan(membership.plan_id);
    
    // Normalize all subscriptions to monthly value
    if (plan.interval === 'month') {
      mrr += plan.price * (plan.interval_count || 1);
    } else if (plan.interval === 'year') {
      mrr += plan.price / 12;
    } else if (plan.interval === 'week') {
      mrr += plan.price * 4.33; // avg weeks per month
    } else if (plan.interval === 'day') {
      mrr += plan.price * 30;
    }
    
    // Account for quantity if applicable
    mrr *= (membership.quantity || 1);
  }
  
  return Math.round(mrr) / 100; // Convert cents to dollars
}
```

#### Calculate Churn Rate
```typescript
async function calculateChurnRate(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Members at start of period
  const startCount = await getMembershipCount(companyId, startDate);
  
  // Members who churned during period
  const churned = await getChurnedMemberships(companyId, startDate, endDate);
  
  if (startCount === 0) return 0;
  
  return (churned.length / startCount) * 100;
}
```

#### Calculate LTV (Customer Lifetime Value)
```typescript
async function calculateLTV(companyId: string): Promise<number> {
  // Get average revenue per user per month
  const arpu = await calculateARPU(companyId);
  
  // Get average customer lifespan in months
  const avgLifespan = await calculateAverageLifespan(companyId);
  
  return arpu * avgLifespan;
}

async function calculateAverageLifespan(companyId: string): Promise<number> {
  // Get all churned memberships
  const churned = await getChurnedMemberships(companyId);
  
  let totalMonths = 0;
  
  for (const membership of churned) {
    const start = new Date(membership.created_at);
    const end = new Date(membership.expires_at || Date.now());
    const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    totalMonths += months;
  }
  
  return churned.length > 0 ? totalMonths / churned.length : 0;
}
```

#### Calculate ARPU (Average Revenue Per User)
```typescript
async function calculateARPU(companyId: string): Promise<number> {
  const mrr = await calculateMRR(companyId);
  const activeMembers = await getActiveMembershipCount(companyId);
  
  return activeMembers > 0 ? mrr / activeMembers : 0;
}
```

#### Calculate Revenue Growth
```typescript
async function calculateRevenueGrowth(
  companyId: string,
  currentMonth: Date,
  previousMonth: Date
): Promise<number> {
  const currentRevenue = await getRevenueForPeriod(companyId, currentMonth);
  const previousRevenue = await getRevenueForPeriod(companyId, previousMonth);
  
  if (previousRevenue === 0) return 0;
  
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}
```

#### Calculate Cohort Retention
```typescript
async function calculateCohortRetention(
  companyId: string,
  cohortMonth: Date
): Promise<CohortData> {
  // Get all members who joined in cohort month
  const cohortMembers = await getMembershipsStartedInMonth(companyId, cohortMonth);
  const cohortSize = cohortMembers.length;
  
  const retention: Record<string, number> = {};
  
  // Calculate retention for each subsequent month
  for (let i = 0; i <= 12; i++) {
    const checkDate = addMonths(cohortMonth, i);
    const stillActive = await countStillActive(cohortMembers, checkDate);
    retention[`month_${i}`] = (stillActive / cohortSize) * 100;
  }
  
  return {
    cohort: formatMonth(cohortMonth),
    size: cohortSize,
    retention
  };
}
```

---

## Icon Usage (Lucide React)

### Common Icons to Use

```typescript
import {
  // Dashboard & Navigation
  LayoutDashboard,
  TrendingUp,
  Users,
  CreditCard,
  Package,
  Settings,
  Menu,
  
  // Metrics & Stats
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  
  // Actions
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
  
  // UI Elements
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Calendar,
  Clock
} from "lucide-react";
```

### Example Icon Usage

```tsx
// In MetricCard component
import { TrendingUp, TrendingDown } from "lucide-react";

<div className="flex items-center gap-2">
  <DollarSign className="h-4 w-4 text-muted-foreground" />
  <span className="text-2xl font-bold">$12,450</span>
  {trend === 'up' ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-500" />
  )}
</div>

// In Sidebar navigation
<nav className="space-y-2">
  <NavLink href="/" icon={LayoutDashboard}>Dashboard</NavLink>
  <NavLink href="/revenue" icon={TrendingUp}>Revenue</NavLink>
  <NavLink href="/members" icon={Users}>Members</NavLink>
  <NavLink href="/payments" icon={CreditCard}>Payments</NavLink>
  <NavLink href="/products" icon={Package}>Products</NavLink>
</nav>
```

---

## UI Components to Build

### Layout

#### `components/layout/AppLayout.tsx`
Main layout wrapper
- Sidebar navigation
- Top header with company info
- Main content area

#### `components/layout/Sidebar.tsx`
Navigation sidebar
- Dashboard link
- Revenue link
- Members link
- Payments link
- Products link
- Settings link

### Dashboard Components

#### `components/dashboard/MetricCard.tsx`
Reusable metric display card
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}
```

#### `components/dashboard/RevenueChart.tsx`
Line chart for revenue over time
- Uses Recharts
- Shows MRR and total revenue
- Supports daily/weekly/monthly views
- Interactive tooltips

#### `components/dashboard/MemberGrowthChart.tsx`
Member growth over time chart
- Line chart showing member count
- Highlights new vs churned

#### `components/dashboard/CohortTable.tsx`
Cohort retention heatmap table
- Color-coded retention percentages
- Expandable rows
- Export functionality

#### `components/dashboard/ProductPerformanceTable.tsx`
Table showing product metrics
- Sortable columns
- Revenue, members, churn per product

#### `components/dashboard/PaymentStats.tsx`
Payment success/failure statistics
- Success rate gauge
- Failed payment count
- Recovery opportunities

### Pages

#### `app/page.tsx`
Dashboard home page
- Overview metrics (4-6 key cards)
- Revenue chart
- Member growth chart
- Recent activity feed

#### `app/revenue/page.tsx`
Detailed revenue analytics
- Revenue over time chart
- Revenue by product breakdown
- Payment method distribution
- MRR history
- Revenue forecasting (V2 feature)

#### `app/members/page.tsx`
Member analytics page
- Total/active/churned counts
- Member timeline chart
- Cohort retention table
- Member list with filters

#### `app/payments/page.tsx`
Payment analytics page
- Payment success rate
- Failed payments list
- Refund tracking
- Payment method breakdown

#### `app/products/page.tsx`
Product performance page
- Product comparison table
- Revenue per product
- Member count per product
- Churn rate by product

#### `app/settings/page.tsx`
App settings
- Sync status and controls
- Webhook configuration
- Export preferences
- Account settings

---

## Data Synchronization Flow

### Initial Sync (On App Install)

```typescript
// app/api/sync/initial/route.ts
export async function POST(request: Request) {
  const { companyId } = await request.json();
  
  try {
    // 1. Fetch all memberships
    const memberships = await fetchAllMemberships(companyId);
    await saveMemberships(memberships);
    
    // 2. Fetch all payments
    const payments = await fetchAllPayments(companyId);
    await savePayments(payments);
    
    // 3. Fetch products
    const products = await fetchAllProducts(companyId);
    await saveProducts(products);
    
    // 4. Fetch members
    const members = await fetchAllMembers(companyId);
    await saveMembers(members);
    
    // 5. Calculate initial metrics
    await calculateAndCacheMetrics(companyId);
    
    // 6. Update sync status
    await updateCompany(companyId, {
      last_synced_at: new Date(),
      sync_status: 'completed'
    });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Incremental Sync (Daily via Cron)

```typescript
// app/api/sync/incremental/route.ts
export async function POST(request: Request) {
  const companies = await getAllCompanies();
  
  for (const company of companies) {
    try {
      const lastSync = company.last_synced_at;
      
      // Fetch data since last sync
      const newMemberships = await fetchMembershipsSince(company.company_id, lastSync);
      await saveMemberships(newMemberships);
      
      const newPayments = await fetchPaymentsSince(company.company_id, lastSync);
      await savePayments(newPayments);
      
      // Recalculate metrics
      await calculateAndCacheMetrics(company.company_id);
      
      await updateCompany(company.company_id, {
        last_synced_at: new Date(),
        sync_status: 'completed'
      });
    } catch (error) {
      console.error(`Sync failed for ${company.company_id}:`, error);
    }
  }
  
  return Response.json({ success: true });
}
```

### Webhook Handler (Real-Time Updates)

```typescript
// app/api/webhooks/whop/route.ts
export async function POST(request: Request) {
  const event = await request.json();
  
  // Verify webhook signature (important for security)
  const isValid = await verifyWhopSignature(request);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const { type, data } = event;
  
  switch (type) {
    case 'membership.went_valid':
      await handleMembershipValid(data);
      break;
      
    case 'membership.went_invalid':
      await handleMembershipInvalid(data);
      break;
      
    case 'payment.succeeded':
      await handlePaymentSucceeded(data);
      break;
      
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
      
    default:
      console.log('Unhandled webhook type:', type);
  }
  
  return Response.json({ received: true });
}

async function handleMembershipValid(membership: any) {
  // Save or update membership
  await upsertMembership(membership);
  
  // Invalidate metric cache
  await invalidateMetricCache(membership.company_id);
  
  // Recalculate MRR and member count
  await recalculateMetrics(membership.company_id, ['mrr', 'member_count']);
}

async function handlePaymentSucceeded(payment: any) {
  // Save payment
  await savePayment(payment);
  
  // Invalidate revenue cache
  await invalidateMetricCache(payment.company_id, 'revenue');
  
  // Recalculate revenue metrics
  await recalculateMetrics(payment.company_id, ['revenue', 'mrr']);
}
```

---

## Whop API Integration

### Setup SDK Client

```typescript
// lib/whop-sdk.ts
import { WhopServerSdk } from "@whop/api";

export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
  appApiKey: process.env.WHOP_API_KEY!,
});

// Helper to create company-specific client
export function getWhopSdkForCompany(companyId: string) {
  return whopSdk.withCompany({ companyId });
}
```

### Fetch Functions

```typescript
// lib/whop-fetchers.ts

export async function fetchAllMemberships(companyId: string) {
  const sdk = getWhopSdkForCompany(companyId);
  const allMemberships = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await sdk.memberships.listMemberships({
      page,
      per: 50
    });
    
    allMemberships.push(...response.data);
    hasMore = response.pagination.next_page !== null;
    page++;
  }
  
  return allMemberships;
}

export async function fetchAllPayments(companyId: string) {
  const sdk = getWhopSdkForCompany(companyId);
  const allPayments = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await sdk.payments.listPayments({
      page,
      per: 50
    });
    
    allPayments.push(...response.data);
    hasMore = response.pagination.next_page !== null;
    page++;
  }
  
  return allPayments;
}

export async function fetchAllProducts(companyId: string) {
  const sdk = getWhopSdkForCompany(companyId);
  const response = await sdk.products.listProducts();
  return response.data;
}

export async function fetchAllMembers(companyId: string) {
  const sdk = getWhopSdkForCompany(companyId);
  const allMembers = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await sdk.members.listMembers({
      page,
      per: 50
    });
    
    allMembers.push(...response.data);
    hasMore = response.pagination.next_page !== null;
    page++;
  }
  
  return allMembers;
}
```

---

## Performance Optimization

### Metric Caching Strategy

1. **Calculate metrics daily** via cron job
2. **Store in `metrics_cache` table**
3. **Serve from cache** for dashboard requests
4. **Invalidate on webhook** events
5. **Recalculate affected metrics** only

### Query Optimization

1. **Add database indexes** on frequently queried columns
2. **Use materialized views** for complex aggregations
3. **Implement pagination** for large data sets
4. **Cache API responses** with React Query
5. **Use database functions** for complex calculations

### Example: Cached Metric Function

```typescript
async function getMetric(
  companyId: string,
  metricType: string,
  startDate: Date,
  endDate: Date
) {
  // Try to get from cache first
  const cached = await getCachedMetric(companyId, metricType, startDate, endDate);
  
  if (cached && isCacheValid(cached)) {
    return cached.metric_value;
  }
  
  // Calculate if not cached
  const value = await calculateMetric(companyId, metricType, startDate, endDate);
  
  // Store in cache
  await cacheMetric(companyId, metricType, value, startDate, endDate);
  
  return value;
}
```

---

## Error Handling

### API Error Responses

```typescript
// lib/api-response.ts
export function successResponse(data: any) {
  return Response.json({ success: true, data });
}

export function errorResponse(message: string, status = 500) {
  return Response.json({ 
    success: false, 
    error: message 
  }, { status });
}

// Usage
try {
  const metrics = await calculateMetrics(companyId);
  return successResponse(metrics);
} catch (error) {
  console.error('Metrics calculation failed:', error);
  return errorResponse('Failed to calculate metrics');
}
```

### Error Logging

```typescript
// lib/logger.ts
export function logError(context: string, error: any, metadata?: any) {
  console.error(`[${context}]`, error);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { extra: metadata });
  }
}
```

---

## Security Considerations

### 1. Webhook Signature Verification

```typescript
async function verifyWhopSignature(request: Request): Promise<boolean> {
  const signature = request.headers.get('whop-signature');
  const body = await request.text();
  
  const expectedSignature = createHmac('sha256', process.env.WHOP_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### 2. Row Level Security (Supabase)

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own company data
CREATE POLICY "Companies access" ON companies
  FOR ALL USING (
    company_id = current_setting('app.current_company_id')::text
  );

CREATE POLICY "Memberships access" ON memberships
  FOR ALL USING (
    company_id = current_setting('app.current_company_id')::text
  );
```

### 3. API Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Testing Strategy

### Unit Tests
- Test metric calculation functions
- Test data transformation logic
- Test date utilities

### Integration Tests
- Test Whop API integration
- Test database operations
- Test webhook handlers

### Example Test

```typescript
// __tests__/calculateMRR.test.ts
import { calculateMRR } from '@/lib/metrics';

describe('calculateMRR', () => {
  it('should calculate MRR correctly for monthly plans', async () => {
    const result = await calculateMRR('test-company-id');
    expect(result).toBeGreaterThan(0);
  });
  
  it('should normalize yearly plans to monthly', async () => {
    // Test implementation
  });
});
```

---

## Deployment Checklist

### Environment Variables (.env.local)

```bash
# Whop
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
API_SECRET_KEY=random_secret_key_for_api_protection
```

### Vercel Configuration

1. **Add environment variables** in Vercel dashboard
2. **Configure cron job** for daily sync:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/sync/incremental",
      "schedule": "0 2 * * *"
    }
  ]
}
```

3. **Set up domains** and SSL
4. **Enable analytics** and monitoring

### Supabase Setup

1. **Run migration scripts** to create all tables
2. **Enable Row Level Security** policies
3. **Set up database backups**
4. **Configure connection pooling**

---

## Monetization & Pricing

### Pricing Tiers

**Free Tier**
- Last 30 days of data only
- Basic metrics (MRR, members, revenue)
- 3 reports per month
- Dashboard-only access

**Pro Tier - $49/month**
- Unlimited historical data
- All metrics + advanced analytics
- Cohort analysis
- Export to CSV/PDF
- Weekly/monthly email reports
- Payment insights
- Priority support

**Enterprise - $149/month**
- Everything in Pro
- Custom metrics & KPIs
- Multi-product deep dive
- API access
- White-label reports
- Dedicated support
- Early access to features

### Payment Integration

Use Whop's built-in payment system:

```typescript
// app/api/upgrade/route.ts
import { whopSdk } from '@/lib/whop-sdk';

export async function POST(request: Request) {
  const { userId, experienceId } = await request.json();
  
  // Create charge for Pro plan
  const result = await whopSdk.payments.chargeUser({
    amount: 4900, // $49 in cents
    currency: 'usd',
    userId: userId,
    metadata: {
      plan: 'pro',
      experienceId: experienceId
    }
  });
  
  return Response.json(result);
}
```

---

## Marketing & Launch Strategy

### Pre-Launch (Week 1-2)

1. **Build in public** on Twitter/X
   - Share progress screenshots
   - Ask for feedback from Whop creators
   
2. **Create landing page** with:
   - Value proposition
   - Demo dashboard screenshots
   - Pricing table
   - Waitlist signup

3. **Recruit beta testers**
   - Offer lifetime free Pro plan
   - Get 5-10 beta users
   - Collect testimonials

### Launch Day

1. **Submit to Whop App Store**
2. **Post in Whop Discord** #apps channel
3. **Twitter announcement** with demo video
4. **Reach out to top creators** directly
5. **ProductHunt launch** (if applicable)

### Post-Launch (Weeks 2-4)

1. **Content marketing:**
   - "10 Metrics Every Whop Creator Must Track"
   - "How to 2x Your Whop Revenue Using Data"
   - Video tutorials on YouTube

2. **Social proof:**
   - Share user wins
   - Post dashboard screenshots
   - Case studies

3. **Feature releases:**
   - Week 2: Email reports
   - Week 3: Cohort analysis
   - Week 4: Export functionality

---

## Success Metrics

### Week 1 Goals
- ✅ 10+ app installs
- ✅ 3+ paying customers
- ✅ $150 MRR

### Month 1 Goals
- ✅ 50+ installs
- ✅ 15+ paying customers
- ✅ $750 MRR
- ✅ 5+ testimonials

### Month 3 Goals
- ✅ 200+ installs
- ✅ 60+ paying customers
- ✅ $3,000 MRR
- ✅ Featured on Whop

### Month 6 Goals
- ✅ 500+ installs
- ✅ 150+ paying customers
- ✅ $7,500 MRR
- ✅ Become #1 analytics app

---

## Development Phases

### Phase 1: MVP (Weeks 1-4)
**Goal:** Get to market fast with core features

- [ ] Database schema setup
- [ ] Initial data sync system
- [ ] Core metric calculations (MRR, revenue, members, churn)
- [ ] Basic dashboard UI
- [ ] Revenue chart
- [ ] Member growth chart
- [ ] Whop App Store listing
- [ ] Deploy to production

### Phase 2: Enhancement (Weeks 5-8)
**Goal:** Add differentiation and stickiness

- [ ] Cohort retention analysis
- [ ] Product performance breakdown
- [ ] Payment analytics
- [ ] CSV export
- [ ] Email reports (weekly/monthly)
- [ ] Improved UI/UX
- [ ] Performance optimization

### Phase 3: Advanced Features (Weeks 9-12)
**Goal:** Build moat and increase pricing power

- [ ] Revenue forecasting
- [ ] Churn prediction
- [ ] Benchmarking (compare to similar communities)
- [ ] Custom date ranges
- [ ] Advanced filters
- [ ] API access for Enterprise
- [ ] Mobile responsive design

### Phase 4: Scale (Month 4+)
**Goal:** Become indispensable

- [ ] Integration with Google Sheets
- [ ] Slack notifications
- [ ] Custom metrics builder
- [ ] White-label reports
- [ ] Multi-company dashboard
- [ ] Mobile app (React Native)

---

## File Structure

```
revenue-analytics-pro/
├── app/
│   ├── page.tsx                    # Dashboard home
│   ├── revenue/
│   │   └── page.tsx                # Revenue analytics
│   ├── members/
│   │   └── page.tsx                # Member analytics
│   ├── payments/
│   │   └── page.tsx                # Payment analytics
│   ├── products/
│   │   └── page.tsx                # Product performance
│   ├── settings/
│   │   └── page.tsx                # Settings
│   ├── api/
│   │   ├── sync/
│   │   │   ├── initial/
│   │   │   │   └── route.ts        # Initial sync
│   │   │   └── incremental/
│   │   │       └── route.ts        # Daily sync
│   │   ├── webhooks/
│   │   │   └── whop/
│   │   │       └── route.ts        # Webhook handler
│   │   ├── metrics/
│   │   │   ├── overview/
│   │   │   │   └── route.ts
│   │   │   ├── revenue/
│   │   │   │   └── route.ts
│   │   │   ├── members/
│   │   │   │   └── route.ts
│   │   │   ├── payments/
│   │   │   │   └── route.ts
│   │   │   ├── cohorts/
│   │   │   │   └── route.ts
│   │   │   └── products/
│   │   │       └── route.ts
│   │   └── upgrade/
│   │       └── route.ts            # Payment/upgrade
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── MemberGrowthChart.tsx
│   │   ├── CohortTable.tsx
│   │   ├── ProductPerformanceTable.tsx
│   │   └── PaymentStats.tsx
│   └── ui/
│       ├── button.tsx              # shadcn components
│       ├── card.tsx
│       ├── chart.tsx
│       ├── table.tsx
│       └── ...
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   └── client.ts               # Drizzle client
│   ├── whop-sdk.ts                 # Whop SDK setup
│   ├── whop-fetchers.ts            # API fetch functions
│   ├── supabase.ts                 # Supabase client (optional)
│   ├── metrics/
│   │   ├── mrr.ts
│   │   ├── churn.ts
│   │   ├── ltv.ts
│   │   ├── cohorts.ts
│   │   └── revenue.ts
│   ├── database/
│   │   ├── memberships.ts
│   │   ├── payments.ts
│   │   ├── members.ts
│   │   └── metrics-cache.ts
│   ├── utils.ts
│   ├── constants.ts
│   ├── logger.ts
│   └── api-response.ts
├── types/
│   ├── index.ts
│   ├── whop.ts
│   ├── metrics.ts
│   └── database.ts
├── drizzle/
│   └── migrations/                 # Generated by drizzle-kit
├── public/
│   └── images/
├── .env.local
├── .env.example
├── drizzle.config.ts
├── vercel.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables Setup

### `.env.local`
```bash
# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Configuration (Drizzle)
# Use the "Transaction" pooler connection string from Supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_SECRET_KEY=generate_a_random_secret_key_here
NODE_ENV=development
```

### `.env.example`
```bash
# Copy this file to .env.local and fill in your values

# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=
WHOP_API_KEY=
WHOP_WEBHOOK_SECRET=

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database Configuration (Drizzle)
DATABASE_URL=

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_SECRET_KEY=
NODE_ENV=development
```

### Getting Your Credentials

**Whop Credentials:**
1. Go to https://whop.com/apps
2. Create or select your app
3. Copy App ID, API Key, and Webhook Secret

**Supabase Credentials:**
1. Go to your Supabase project settings
2. Navigate to API section for URL and keys
3. Navigate to Database > Connection String
4. Select "Transaction" pooler (important for Drizzle!)
5. Copy the connection string as DATABASE_URL

---

## Utility Functions Setup

### `lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format large numbers
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Format date
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

// Get date range for periods
export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  
  return { start, end };
}
```

### `lib/constants.ts`
```typescript
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
```

### `types/index.ts`
```typescript
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
```

---

## Quick Start Commands

```bash
# 1. Install all dependencies
npm install

# 2. Install Drizzle and other required packages
npm install @whop/api drizzle-orm @supabase/supabase-js postgres @tanstack/react-query recharts lucide-react date-fns zod class-variance-authority clsx tailwind-merge
npm install -D drizzle-kit

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Whop, Supabase, and Database credentials

# 4. Generate and push database schema
npx drizzle-kit generate:pg
npx drizzle-kit push:pg

# 5. Verify database connection
npx drizzle-kit studio

# 6. Start development server
npm run dev

# 7. Build for production
npm run build

# 8. Deploy to Vercel
vercel deploy
```

### Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

---

## Key Success Factors

1. **Speed to Market** - Launch MVP in 2-4 weeks max
2. **Data Accuracy** - Metrics must be 100% accurate
3. **Performance** - Dashboard loads in <2 seconds
4. **UX** - Clean, scannable, intuitive interface
5. **Value Clarity** - Clear ROI messaging: "Know your numbers = grow revenue"
6. **Support** - Quick responses to early users
7. **Marketing** - Consistent content and presence
8. **Iteration** - Ship features based on user feedback

---

## Common Pitfalls to Avoid

1. ❌ **Over-engineering** - Start simple, add complexity later
2. ❌ **Analysis paralysis** - Don't wait for perfect, ship MVP
3. ❌ **Ignoring feedback** - Listen to early users religiously
4. ❌ **Complex pricing** - Keep it simple: Free, Pro, Enterprise
5. ❌ **Poor onboarding** - First 5 minutes = critical for retention
6. ❌ **Neglecting marketing** - Great product + no marketing = failure
7. ❌ **Slow syncs** - Optimize data fetching early
8. ❌ **Inaccurate metrics** - Test calculations extensively

---

## Support & Resources

### Documentation
- Whop API Docs: https://dev.whop.com
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

### Community
- Whop Discord: Join #app-developers channel
- Twitter: Follow @whop for updates

### Tools
- Recharts: https://recharts.org
- shadcn/ui: https://ui.shadcn.com
- React Query: https://tanstack.com/query

---

## Final Notes

This app has ZERO competition and solves a universal problem. Every creator with >$1K/month revenue needs analytics. You're not building a "nice to have" - you're building essential infrastructure.

**The opportunity:**
- 19,002 creators use Courses
- 16,131 use Files
- If just 1% pay $49/month = $7,850 MRR
- If 5% convert = $39,250 MRR potential

**Your advantage:**
- First mover
- Clear positioning
- High switching costs (data lock-in)
- Network effects (benchmarking)

**Execute fast. Ship now. Iterate always.**

Good luck! 🚀

---

## 🤖 Implementation Guide for Claude Code

### Step-by-Step Build Instructions

**Phase 1: Database Setup (30 mins)**
1. Create `lib/db/schema.ts` with all table definitions (use the Drizzle schema above)
2. Create `lib/db/client.ts` with database client
3. Create `drizzle.config.ts` in root
4. Run `npx drizzle-kit generate:pg` to generate migrations
5. Run `npx drizzle-kit push:pg` to push schema to Supabase
6. Verify with `npx drizzle-kit studio`

**Phase 2: Core Functions (1 hour)**
1. Create `lib/utils.ts` with utility functions (formatting, date helpers)
2. Create `lib/constants.ts` with constants
3. Create `types/index.ts` with TypeScript interfaces
4. Create `lib/whop-fetchers.ts` with API fetch functions
5. Create metric calculation functions in `lib/metrics/`:
   - `mrr.ts` - Calculate MRR
   - `churn.ts` - Calculate churn rate
   - `ltv.ts` - Calculate lifetime value
   - `revenue.ts` - Calculate revenue metrics
   - `cohorts.ts` - Calculate cohort retention

**Phase 3: API Routes (1 hour)**
1. Create `/api/sync/initial/route.ts` for initial data sync
2. Create `/api/sync/incremental/route.ts` for daily sync
3. Create `/api/webhooks/whop/route.ts` for webhooks
4. Create metric API routes in `/api/metrics/`:
   - `overview/route.ts` - Dashboard overview
   - `revenue/route.ts` - Revenue data
   - `members/route.ts` - Member data
   - `payments/route.ts` - Payment data
   - `cohorts/route.ts` - Cohort data
   - `products/route.ts` - Product performance

**Phase 4: UI Components (2 hours)**
1. Install shadcn/ui components (see setup section)
2. Create layout components:
   - `components/layout/AppLayout.tsx`
   - `components/layout/Sidebar.tsx`
   - `components/layout/Header.tsx`
3. Create dashboard components:
   - `components/dashboard/MetricCard.tsx`
   - `components/dashboard/RevenueChart.tsx`
   - `components/dashboard/MemberGrowthChart.tsx`
   - `components/dashboard/CohortTable.tsx`
   - `components/dashboard/PaymentStats.tsx`
   - `components/dashboard/ProductPerformanceTable.tsx`

**Phase 5: Pages (1 hour)**
1. Create `app/page.tsx` - Dashboard home
2. Create `app/revenue/page.tsx` - Revenue analytics
3. Create `app/members/page.tsx` - Member analytics
4. Create `app/payments/page.tsx` - Payment analytics
5. Create `app/products/page.tsx` - Product performance
6. Create `app/settings/page.tsx` - Settings

**Phase 6: Testing & Polish (30 mins)**
1. Test data sync with real Whop data
2. Verify all metrics calculate correctly
3. Test webhook handlers
4. Ensure UI is responsive
5. Add loading states and error handling

### Key Files to Create First

**Priority 1 (Critical Path):**
1. `lib/db/schema.ts` - Database schema
2. `lib/db/client.ts` - Database client  
3. `lib/utils.ts` - Utilities
4. `lib/whop-fetchers.ts` - API fetchers
5. `api/sync/initial/route.ts` - Initial sync

**Priority 2 (Core Logic):**
6. `lib/metrics/mrr.ts` - MRR calculation
7. `lib/metrics/churn.ts` - Churn calculation
8. `api/metrics/overview/route.ts` - Overview API
9. `components/dashboard/MetricCard.tsx` - Metric card
10. `app/page.tsx` - Dashboard home

**Priority 3 (Enhancement):**
11. All other metric files
12. All other API routes
13. All other components
14. All other pages

### Testing Checklist

- [ ] Database schema created and pushed
- [ ] Can fetch data from Whop API
- [ ] Data saves to Supabase correctly
- [ ] MRR calculation is accurate
- [ ] Dashboard displays metrics
- [ ] Charts render correctly
- [ ] Webhooks receive events
- [ ] Real-time updates work
- [ ] UI is responsive on mobile
- [ ] Error states handled gracefully

### Common Issues & Solutions

**Issue:** Can't connect to Supabase
- **Solution:** Use Transaction pooler URL, not Session pooler

**Issue:** Drizzle queries failing
- **Solution:** Make sure `prepare: false` is set in postgres client

**Issue:** Metrics are incorrect
- **Solution:** Check date ranges and ensure you're filtering by company_id

**Issue:** Charts not rendering
- **Solution:** Ensure data is in correct format for Recharts

**Issue:** Webhooks not working
- **Solution:** Verify webhook signature and check Whop dashboard

### Performance Tips

1. **Use metric cache table** - Don't recalculate metrics on every request
2. **Batch API calls** - Fetch all data in parallel when possible
3. **Index database properly** - All queries should use indexes
4. **Lazy load charts** - Use React.lazy for chart components
5. **Debounce calculations** - Don't recalculate on every webhook

### Launch Preparation

Before submitting to Whop App Store:
- [ ] All features working
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Environment variables documented
- [ ] README.md written
- [ ] Screenshots taken for app store
- [ ] Pricing tiers configured
- [ ] Test with real Whop creators

---

## Final Notes for Claude Code

**Remember:**
- This spec is comprehensive but start with MVP
- Focus on accuracy over features
- Dashboard should load in <2 seconds
- Mobile-first design
- Clear error messages
- Consistent styling with shadcn/ui

**The Big Picture:**
You're building essential infrastructure for Whop creators. Every serious creator needs to know their numbers. This isn't a nice-to-have - it's a must-have. Execute well and you'll become the default analytics solution.

**Questions to ask if unclear:**
1. Database schema structure
2. Metric calculation logic
3. UI component design
4. API endpoint behavior
5. Webhook event handling

Start with Phase 1 and work sequentially. Good luck! 🚀
