CREATE TABLE "store_analytics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL REFERENCES "public"."stores"("id") ON DELETE CASCADE,
	"day" varchar(10) NOT NULL,
	"sessions" integer DEFAULT 0,
	"product_views" integer DEFAULT 0,
	"add_to_carts" integer DEFAULT 0,
	"checkouts" integer DEFAULT 0,
	"orders_placed" integer DEFAULT 0,
	"revenue" numeric(14, 2) DEFAULT '0',
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "store_analytics_daily_store_id_day" ON "store_analytics_daily" USING btree ("store_id","day");
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL REFERENCES "public"."stores"("id") ON DELETE CASCADE,
	"name" varchar(255) NOT NULL,
	"channel" varchar(32) DEFAULT 'meta' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"budget" numeric(12, 2) DEFAULT '0',
	"spend" numeric(12, 2) DEFAULT '0',
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"notes" text,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
