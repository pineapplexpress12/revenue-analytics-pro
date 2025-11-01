# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
- Use `pnpm` for all package management operations
- Install dependencies: `pnpm i`

### Development Server
- Start dev server: `pnpm dev` (uses whop-proxy to enable localhost testing)
- Build: `pnpm build`
- Start production: `pnpm start`
- Lint: `pnpm lint` (uses Biome)

### Database Commands
- Push schema changes: `pnpm db:push`
- Generate migrations: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`
- Open database studio: `pnpm db:studio`
- Seed test data: `pnpm db:seed`

All database commands require `.env.development.local` to be configured with valid Postgres credentials.

## Architecture Overview

### Application Type
This is a **Whop embedded app** built with Next.js 16 (App Router) that provides SaaS analytics and member management for Whop companies.

### Key Technologies
- **Framework**: Next.js 16 with App Router, React 19
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Linter**: Biome (not ESLint)
- **Whop SDK**: `@whop/sdk` for API interactions, `@whop/react` for React components
- **Dev Tooling**: `@whop-apps/dev-proxy` for local development

### Authentication & Access Control
- User authentication handled by Whop SDK via `whopsdk.verifyUserToken()`
- Access control based on two mechanisms:
  - Admin bypass: Check if user ID matches `NEXT_PUBLIC_WHOP_AGENT_USER_ID`
  - Access pass validation: Check if user has `NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID` via `whopsdk.users.checkAccess()`
- Access validation logic in `app/experiences/[experienceId]/page.tsx:18-32`

### Database Schema Architecture
The schema (`lib/db/schema.ts`) models a complete SaaS analytics system:

**Core Entities:**
- `companies` - Whop companies (keyed on `whopCompanyId`)
- `products` - Products belonging to companies
- `plans` - Pricing plans for products (supports various billing periods)
- `members` - Customers/users (keyed on `whopUserId`)
- `memberships` - Active subscriptions linking members to products/plans
- `payments` - Payment transactions with status tracking

**Analytics & Support:**
- `metricsCache` - Cached computed analytics (MRR, ARR, churn, LTV) by period
- `memberAnalytics` - Per-member insights including churn risk and engagement scores
- `benchmarkData` - Industry benchmarks by niche and revenue range
- `emailReportSettings` - Scheduled email report configuration
- `syncLogs` - Data synchronization tracking

All tables use CUID2 for primary keys and include `createdAt`/`updatedAt` timestamps.

### Data Synchronization Pattern
The app syncs data from Whop API to local database:

1. **Initial Sync** (`app/api/sync/initial/route.ts`): Full sync of all products, plans, members, memberships, and payments for a company
2. **Incremental Sync** (`app/api/sync/incremental/route.ts`): Fetch only records created since last sync
3. **Webhook Updates** (`app/api/webhooks/route.ts`): Real-time updates via Whop webhooks for:
   - `membership.activated` / `membership.deactivated`
   - `payment.succeeded` / `payment.failed`

Webhooks use `@vercel/functions` `waitUntil()` for async processing and call `invalidateMetricCache()` after data changes.

### Metrics Calculation
Metrics are calculated in `lib/metrics/`:
- `mrr.ts` - Monthly Recurring Revenue calculations normalizing different billing periods
- `ltv.ts` - Lifetime Value calculations
- `churn.ts` - Churn rate calculations
- `revenue.ts` - Revenue analytics

Metrics cache system (`lib/metrics-cache.ts`) prevents redundant calculations.

### Routing Structure
- `/experiences/[experienceId]` - Main dashboard (requires Whop user authentication)
- `/dashboard/[companyId]` - Company-specific dashboard view
- `/discover` - Discover page
- Client components handle UI state (e.g., `DashboardClient.tsx`, `MembersClient.tsx`)

### Environment Variables Required
```
NEXT_PUBLIC_WHOP_APP_ID
WHOP_API_KEY
WHOP_WEBHOOK_SECRET
NEXT_PUBLIC_WHOP_AGENT_USER_ID
NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID
POSTGRES_URL or DATABASE_URL
POSTGRES_URL_NON_POOLING (for migrations)
```

### Code Style
- Uses Biome for linting/formatting
- Tabs for indentation (not spaces)
- Double quotes for strings
- Organize imports enabled

### Whop Integration Specifics
- Whop paths must be explicitly set in developer dashboard:
  - App path: `/experiences/[experienceId]`
  - Dashboard path: `/dashboard/[companyId]`
  - Discover path: `/discover`
- Use whop-proxy during development for localhost testing
- Webhook verification uses `whopsdk.webhooks.unwrap()`
- Fetchers in `lib/whop-fetchers.ts` handle paginated API responses with async iterators
