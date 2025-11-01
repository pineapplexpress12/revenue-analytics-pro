ALTER TABLE "products" ADD COLUMN "is_app" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "products_is_app_idx" ON "products" USING btree ("is_app");