-- Migration 0009: Products phase 2 — inventory history, stock reservations, bundles, barcode/sort_order/publish_at columns

-- ── products table new columns ───────────────────────────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" varchar(120);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "publish_at" timestamp with time zone;

-- ── inventory_history ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "inventory_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "public"."products"("id") ON DELETE CASCADE,
  "store_id" uuid NOT NULL REFERENCES "public"."stores"("id") ON DELETE CASCADE,
  "change_type" varchar(30) NOT NULL,
  -- 'manual' | 'order' | 'restock' | 'import' | 'adjustment' | 'reservation' | 'reservation_expired'
  "delta" integer NOT NULL,
  "stock_before" integer NOT NULL,
  "stock_after" integer NOT NULL,
  "reason" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "inventory_history_product_id_idx" ON "inventory_history" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "inventory_history_store_id_idx" ON "inventory_history" USING btree ("store_id");
CREATE INDEX IF NOT EXISTS "inventory_history_created_at_idx" ON "inventory_history" USING btree ("created_at");

-- ── stock_reservations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "stock_reservations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "public"."products"("id") ON DELETE CASCADE,
  "store_id" uuid NOT NULL REFERENCES "public"."stores"("id") ON DELETE CASCADE,
  "session_id" varchar(255) NOT NULL,
  "quantity" integer NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  -- 'pending' | 'confirmed' | 'expired'
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "stock_reservations_product_id_idx" ON "stock_reservations" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_session_id_idx" ON "stock_reservations" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_status_idx" ON "stock_reservations" USING btree ("status");
CREATE INDEX IF NOT EXISTS "stock_reservations_expires_at_idx" ON "stock_reservations" USING btree ("expires_at");

-- ── bundles ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bundles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "public"."stores"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "description" text,
  "discount_type" varchar(20) DEFAULT 'percentage' NOT NULL,
  -- 'percentage' | 'fixed'
  "discount_value" numeric(10, 2) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "bundles_store_id_idx" ON "bundles" USING btree ("store_id");

CREATE TABLE IF NOT EXISTS "bundle_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bundle_id" uuid NOT NULL REFERENCES "public"."bundles"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "public"."products"("id") ON DELETE CASCADE,
  "quantity" integer DEFAULT 1 NOT NULL
);
CREATE INDEX IF NOT EXISTS "bundle_items_bundle_id_idx" ON "bundle_items" USING btree ("bundle_id");
CREATE INDEX IF NOT EXISTS "bundle_items_product_id_idx" ON "bundle_items" USING btree ("product_id");
