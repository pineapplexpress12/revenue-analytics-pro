CREATE TABLE "benchmark_data" (
	"id" text PRIMARY KEY NOT NULL,
	"niche" text NOT NULL,
	"revenue_range" text NOT NULL,
	"avg_mrr" numeric(10, 2) NOT NULL,
	"avg_churn_rate" numeric(5, 2) NOT NULL,
	"avg_ltv" numeric(10, 2) NOT NULL,
	"avg_arpu" numeric(10, 2) NOT NULL,
	"sample_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "benchmark_data_niche_idx" ON "benchmark_data" USING btree ("niche");--> statement-breakpoint
CREATE INDEX "benchmark_data_revenue_range_idx" ON "benchmark_data" USING btree ("revenue_range");--> statement-breakpoint
CREATE INDEX "benchmark_data_niche_range_idx" ON "benchmark_data" USING btree ("niche","revenue_range");