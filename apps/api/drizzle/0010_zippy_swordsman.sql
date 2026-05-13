CREATE TABLE "cms_block_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"schema" json,
	"defaults" json,
	"styles" json,
	"source" varchar(20) DEFAULT 'core' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"url" varchar(1024) NOT NULL,
	"filename" varchar(255),
	"mime_type" varchar(100),
	"size" integer,
	"width" integer,
	"height" integer,
	"alt" varchar(255),
	"kind" varchar(20) DEFAULT 'image',
	"metadata" json DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_page_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"definition_id" uuid,
	"block_type" varchar(50) NOT NULL,
	"settings" json,
	"sort_order" integer DEFAULT 0,
	"enabled" boolean DEFAULT true,
	"show_on_desktop" boolean DEFAULT true,
	"show_on_mobile" boolean DEFAULT true,
	"styles" json,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"kind" varchar(30) DEFAULT 'custom' NOT NULL,
	"layout" json,
	"publish_at" timestamp with time zone,
	"is_published" boolean DEFAULT false,
	"seo_title" varchar(255),
	"seo_description" text,
	"seo_image" varchar(1024),
	"custom_head" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"layout_snapshot" json,
	"type" varchar(20) DEFAULT 'autosave',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"content" json,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"layout" json,
	"scope" varchar(20) DEFAULT 'store',
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"resource_type" varchar(30) NOT NULL,
	"resource_id" uuid NOT NULL,
	"locale" varchar(10) NOT NULL,
	"content" json DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"reason" varchar(50) NOT NULL,
	"quantity_change" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reference_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"previous_status" varchar(50),
	"new_status" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending'
);
--> statement-breakpoint
ALTER TABLE "bundle_items" DROP CONSTRAINT "bundle_items_bundle_id_bundles_id_fk";
--> statement-breakpoint
ALTER TABLE "bundle_items" DROP CONSTRAINT "bundle_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "bundles" DROP CONSTRAINT "bundles_store_id_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_store_id_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "bundles" ALTER COLUMN "discount_value" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bundles" ALTER COLUMN "discount_value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bundles" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "publish_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cms_block_definitions" ADD CONSTRAINT "cms_block_definitions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_page_blocks" ADD CONSTRAINT "cms_page_blocks_page_id_cms_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_page_blocks" ADD CONSTRAINT "cms_page_blocks_definition_id_cms_block_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."cms_block_definitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_page_id_cms_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_snippets" ADD CONSTRAINT "cms_snippets_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_templates" ADD CONSTRAINT "cms_templates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_translations" ADD CONSTRAINT "cms_translations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cms_block_def_store_idx" ON "cms_block_definitions" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_block_def_name_store_uniq" ON "cms_block_definitions" USING btree ("name","store_id");--> statement-breakpoint
CREATE INDEX "cms_media_store_idx" ON "cms_media" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "cms_page_blocks_page_idx" ON "cms_page_blocks" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "cms_pages_store_idx" ON "cms_pages" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_pages_slug_store_uniq" ON "cms_pages" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "cms_revisions_page_idx" ON "cms_revisions" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "cms_snippets_store_idx" ON "cms_snippets" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_snippets_name_store_uniq" ON "cms_snippets" USING btree ("store_id","name");--> statement-breakpoint
CREATE INDEX "cms_templates_store_idx" ON "cms_templates" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_templates_name_store_uniq" ON "cms_templates" USING btree ("store_id","name");--> statement-breakpoint
CREATE INDEX "cms_translations_store_idx" ON "cms_translations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "cms_translations_resource_idx" ON "cms_translations" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_translations_uniq" ON "cms_translations" USING btree ("store_id","resource_type","resource_id","locale");--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;