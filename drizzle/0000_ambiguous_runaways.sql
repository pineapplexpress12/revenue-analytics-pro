CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"whop_company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_whop_company_id_unique" UNIQUE("whop_company_id")
);
--> statement-breakpoint
CREATE TABLE "email_report_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"recipient_email" text NOT NULL,
	"frequency" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_sent_at" timestamp,
	"next_scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"member_id" text NOT NULL,
	"total_revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_payments" integer DEFAULT 0 NOT NULL,
	"average_payment" numeric(10, 2) DEFAULT '0' NOT NULL,
	"lifetime_months" integer DEFAULT 0 NOT NULL,
	"last_payment_at" timestamp,
	"churn_risk_score" integer DEFAULT 0 NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"whop_user_id" text NOT NULL,
	"email" text,
	"username" text,
	"profile_picture_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_whop_user_id_unique" UNIQUE("whop_user_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"member_id" text NOT NULL,
	"product_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"whop_membership_id" text NOT NULL,
	"status" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_whop_membership_id_unique" UNIQUE("whop_membership_id")
);
--> statement-breakpoint
CREATE TABLE "metrics_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"metric_type" text NOT NULL,
	"period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"value" numeric(15, 2) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"membership_id" text,
	"member_id" text NOT NULL,
	"whop_payment_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"refunded_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_whop_payment_id_unique" UNIQUE("whop_payment_id")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"whop_plan_id" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"billing_period" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_whop_plan_id_unique" UNIQUE("whop_plan_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"whop_product_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_whop_product_id_unique" UNIQUE("whop_product_id")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text,
	"sync_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"status" text NOT NULL,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_report_settings" ADD CONSTRAINT "email_report_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_analytics" ADD CONSTRAINT "member_analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_analytics" ADD CONSTRAINT "member_analytics_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_cache" ADD CONSTRAINT "metrics_cache_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_whop_company_id_idx" ON "companies" USING btree ("whop_company_id");--> statement-breakpoint
CREATE INDEX "email_report_settings_company_id_idx" ON "email_report_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "email_report_settings_frequency_idx" ON "email_report_settings" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "member_analytics_company_id_idx" ON "member_analytics" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "member_analytics_member_id_idx" ON "member_analytics" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_analytics_churn_risk_idx" ON "member_analytics" USING btree ("churn_risk_score");--> statement-breakpoint
CREATE INDEX "members_company_id_idx" ON "members" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "members_whop_user_id_idx" ON "members" USING btree ("whop_user_id");--> statement-breakpoint
CREATE INDEX "members_email_idx" ON "members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "memberships_company_id_idx" ON "memberships" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "memberships_member_id_idx" ON "memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "memberships_product_id_idx" ON "memberships" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "memberships_plan_id_idx" ON "memberships" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "memberships_whop_membership_id_idx" ON "memberships" USING btree ("whop_membership_id");--> statement-breakpoint
CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "metrics_cache_company_id_idx" ON "metrics_cache" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "metrics_cache_metric_type_idx" ON "metrics_cache" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "metrics_cache_period_idx" ON "metrics_cache" USING btree ("period");--> statement-breakpoint
CREATE INDEX "metrics_cache_period_start_idx" ON "metrics_cache" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "metrics_cache_company_metric_period_idx" ON "metrics_cache" USING btree ("company_id","metric_type","period","period_start");--> statement-breakpoint
CREATE INDEX "payments_company_id_idx" ON "payments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payments_membership_id_idx" ON "payments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "payments_member_id_idx" ON "payments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "payments_whop_payment_id_idx" ON "payments" USING btree ("whop_payment_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "plans_product_id_idx" ON "plans" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "plans_whop_plan_id_idx" ON "plans" USING btree ("whop_plan_id");--> statement-breakpoint
CREATE INDEX "products_company_id_idx" ON "products" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "products_whop_product_id_idx" ON "products" USING btree ("whop_product_id");--> statement-breakpoint
CREATE INDEX "sync_logs_company_id_idx" ON "sync_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sync_logs_sync_type_idx" ON "sync_logs" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "sync_logs_entity_type_idx" ON "sync_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "sync_logs_status_idx" ON "sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_logs_started_at_idx" ON "sync_logs" USING btree ("started_at");