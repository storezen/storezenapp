-- Product merchandising + smart collections
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_draft" boolean DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "vendor" varchar(255);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_type" varchar(255);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" varchar(120);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "track_inventory" boolean DEFAULT true;

UPDATE "products" SET "is_draft" = false WHERE "is_draft" IS NULL;
UPDATE "products" SET "track_inventory" = true WHERE "track_inventory" IS NULL;

ALTER TABLE "store_collections" ADD COLUMN IF NOT EXISTS "collection_kind" varchar(20) DEFAULT 'manual';

UPDATE "store_collections" SET "collection_kind" = 'manual' WHERE "collection_kind" IS NULL;

CREATE TABLE IF NOT EXISTS "store_collection_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "collection_id" uuid NOT NULL REFERENCES "store_collections"("id") ON DELETE CASCADE,
  "field" varchar(50) NOT NULL,
  "operator" varchar(20) NOT NULL,
  "value" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "store_collection_rules_collection_id_idx" ON "store_collection_rules" ("collection_id");
