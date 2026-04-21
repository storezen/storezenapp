import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 50 }).default("free"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const storesTable = pgTable("stores", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  logo: varchar("logo", { length: 1024 }),
  theme: varchar("theme", { length: 100 }).default("minimal"),
  themeColors: jsonb("theme_colors").default(sql`'{}'::jsonb`),
  tiktokPixel: varchar("tiktok_pixel", { length: 255 }),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  whatsappProvider: varchar("whatsapp_provider", { length: 100 }).default("ultramsg"),
  whatsappApiKey: varchar("whatsapp_api_key", { length: 1024 }),
  whatsappInstance: varchar("whatsapp_instance", { length: 255 }),
  deliverySettings: jsonb("delivery_settings").default(sql`'{}'::jsonb`),
  paymentMethods: jsonb("payment_methods").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  stock: integer("stock").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  images: jsonb("images").default(sql`'[]'::jsonb`),
  variants: jsonb("variants").default(sql`'{}'::jsonb`),
  urduDescription: text("urdu_description"),
  tiktokCaption: text("tiktok_caption"),
  whatsappText: text("whatsapp_text"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDesc: text("meta_desc"),
  category: varchar("category", { length: 255 }),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerCity: varchar("customer_city", { length: 255 }).notNull(),
  customerAddress: text("customer_address").notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 12, scale: 2 }).default("0"),
  discount: numeric("discount", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cod"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  orderStatus: varchar("order_status", { length: 50 }).default("new"),
  couponCode: varchar("coupon_code", { length: 100 }),
  refCode: varchar("ref_code", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  courier: varchar("courier", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const shipmentsTable = pgTable("shipments", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  courier: varchar("courier", { length: 255 }).notNull(),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  bookingId: varchar("booking_id", { length: 255 }),
  status: varchar("status", { length: 100 }).default("booked"),
  rawStatus: jsonb("raw_status"),
  bookedAt: timestamp("booked_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const whatsappLogsTable = pgTable("whatsapp_logs", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  orderId: uuid("order_id"),
  phone: varchar("phone", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("sent"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
});

export const conversationStateTable = pgTable("conversation_state", {
  id: uuid("id").primaryKey(),
  phone: varchar("phone", { length: 50 }).notNull(),
  orderId: uuid("order_id"),
  waitingFor: varchar("waiting_for", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const influencersTable = pgTable("influencers", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  refCode: varchar("ref_code", { length: 100 }).unique().notNull(),
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }).default("10"),
  totalClicks: integer("total_clicks").default(0),
  totalOrders: integer("total_orders").default(0),
  totalCommission: numeric("total_commission", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const couponsTable = pgTable("coupons", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  code: varchar("code", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minOrder: numeric("min_order", { precision: 12, scale: 2 }).default("0"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const reviewsTable = pgTable("reviews", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  images: jsonb("images").default(sql`'[]'::jsonb`),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const storePagesTable = pgTable("store_pages", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .unique()
    .references(() => storesTable.id),
  homeBlocks: jsonb("home_blocks").default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const platformSettingsTable = pgTable("platform_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceMode: boolean("maintenance_mode").default(false),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

