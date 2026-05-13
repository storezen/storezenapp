ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "meta_pixel" varchar(255);

CREATE TABLE IF NOT EXISTS "store_collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "description" text,
  "image" varchar(1024),
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "store_collections_store_slug_uniq" ON "store_collections" ("store_id", "slug");

CREATE TABLE IF NOT EXISTS "store_collection_products" (
  "collection_id" uuid NOT NULL REFERENCES "store_collections"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0,
  PRIMARY KEY ("collection_id", "product_id")
);

ALTER TABLE "abandoned_carts" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp with time zone;
