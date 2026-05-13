CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id"),
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "previous_status" varchar(50) NOT NULL,
  "next_status" varchar(50) NOT NULL,
  "changed_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "abandoned_carts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "customer_phone" varchar(50),
  "customer_name" varchar(255),
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "recovered" boolean DEFAULT false,
  "source" varchar(30) DEFAULT 'web',
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bundles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "discount_type" varchar(30) DEFAULT 'percentage',
  "discount_value" numeric(12, 2) DEFAULT '0',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bundle_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bundle_id" uuid NOT NULL REFERENCES "bundles"("id"),
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "quantity" integer DEFAULT 1
);
