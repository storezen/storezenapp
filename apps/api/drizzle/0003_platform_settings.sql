CREATE TABLE "platform_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "maintenance_mode" boolean DEFAULT false,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "updated_at" timestamp with time zone DEFAULT now()
);
