import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** CMS page layout structure — array of block instances */
export type CmsLayout = CmsBlock[];

export interface CmsBlock {
  id: string;
  blockType: string;
  definitionId?: string;
  settings: Record<string, unknown>;
  enabled: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  styles?: Record<string, string>;
  sortOrder?: number;
}

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
  metaPixel: varchar("meta_pixel", { length: 255 }),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  whatsappProvider: varchar("whatsapp_provider", { length: 100 }).default("ultramsg"),
  whatsappApiKey: varchar("whatsapp_api_key", { length: 1024 }),
  whatsappInstance: varchar("whatsapp_instance", { length: 255 }),
  deliverySettings: jsonb("delivery_settings").default(sql`'{}'::jsonb`),
  paymentMethods: jsonb("payment_methods").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const storeCollectionsTable = pgTable(
  "store_collections",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    image: varchar("image", { length: 1024 }),
    sortOrder: integer("sort_order").default(0),
    /** Max products shown for this collection on the storefront; null = no cap. */
    maxProducts: integer("max_products"),
    isActive: boolean("is_active").default(true),
    /** `manual` = explicit product list; `smart` = rules-based membership. */
    collectionKind: varchar("collection_kind", { length: 20 }).default("manual").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("store_collections_store_slug_uniq").on(t.storeId, t.slug)],
);

export const storeCollectionRulesTable = pgTable("store_collection_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => storeCollectionsTable.id, { onDelete: "cascade" }),
  field: varchar("field", { length: 50 }).notNull(),
  operator: varchar("operator", { length: 20 }).notNull(),
  value: text("value").notNull(),
});

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
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
  isDraft: boolean("is_draft").default(false),
  vendor: varchar("vendor", { length: 255 }),
  productType: varchar("product_type", { length: 255 }),
  sku: varchar("sku", { length: 120 }),
  barcode: varchar("barcode", { length: 120 }),
  trackInventory: boolean("track_inventory").default(true),
  sortOrder: integer("sort_order").default(0),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const storeCollectionProductsTable = pgTable(
  "store_collection_products",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => storeCollectionsTable.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.productId] })],
);

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

// Inventory history log
export const inventoryHistoryTable = pgTable("inventory_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  // manual, order, restock, import
  reason: varchar("reason", { length: 50 }).notNull(),
  // positive = added, negative = removed
  quantityChange: integer("quantity_change").notNull(),
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  referenceId: uuid("reference_id"), // order_id, user_id, etc.
  note: text("note"),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Product bundles (kits/discounts)
export const bundlesTable = pgTable("bundles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 30 }).default("percentage"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bundleItemsTable = pgTable("bundle_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => bundlesTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
});

// Stock reservations (cart hold)
export const stockReservationsTable = pgTable("stock_reservations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  reservedAt: timestamp("reserved_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
});

export const orderStatusHistoryTable = pgTable("order_status_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  previousStatus: varchar("previous_status", { length: 50 }).notNull(),
  nextStatus: varchar("next_status", { length: 50 }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(),
});

// ── Order Events Log (event sourcing) ─────────────────────────────────────────
export const orderEventsTable = pgTable("order_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  // order_created, order_confirmed, order_shipped, order_delivered, etc.
  eventType: varchar("event_type", { length: 50 }).notNull(),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  // JSON metadata (tracking info, courier data, etc.)
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const abandonedCartsTable = pgTable("abandoned_carts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerName: varchar("customer_name", { length: 255 }),
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  recovered: boolean("recovered").default(false),
  source: varchar("source", { length: 30 }).default("web"),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
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

/** One row per store per calendar day; feeds dashboard analytics. */
export const storeAnalyticsDailyTable = pgTable(
  "store_analytics_daily",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    day: varchar("day", { length: 10 }).notNull(),
    sessions: integer("sessions").default(0),
    productViews: integer("product_views").default(0),
    addToCarts: integer("add_to_carts").default(0),
    checkouts: integer("checkouts").default(0),
    ordersPlaced: integer("orders_placed").default(0),
    revenue: numeric("revenue", { precision: 14, scale: 2 }).default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("store_analytics_daily_store_id_day").on(t.storeId, t.day)],
);

export const marketingCampaignsTable = pgTable("marketing_campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 32 }).notNull().default("meta"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  budget: numeric("budget", { precision: 12, scale: 2 }).default("0"),
  spend: numeric("spend", { precision: 12, scale: 2 }).default("0"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  notes: text("notes"),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── CMS: reusable block definitions ────────────────────────────────────────────
export const cmsBlockDefinitionsTable = pgTable(
  "cms_block_definitions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id").references(() => storesTable.id, { onDelete: "cascade" }),
    /** null = platform-level (available to all stores) */
    name: varchar("name", { length: 100 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    /** JSON Schema for this block type's settings */
    schema: json("schema").$type<Record<string, unknown>>(),
    /** Default settings JSON */
    defaults: json("defaults").$type<Record<string, unknown>>(),
    /** Custom CSS tokens (color, spacing, typography overrides) */
    styles: json("styles").$type<Record<string, string>>(),
    /** 'core' | 'custom' | 'app' */
    source: varchar("source", { length: 20 }).default("core").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("cms_block_def_store_idx").on(t.storeId),
    uniqueIndex("cms_block_def_name_store_uniq").on(t.name, t.storeId),
  ],
);

// ── CMS: pages (homepage, landing, campaign, blog, policy, etc.) ──────────────
export const cmsPagesTable = pgTable(
  "cms_pages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    /** URL slug — e.g. 'homepage', 'summer-sale', 'size-guide' */
    slug: varchar("slug", { length: 100 }).notNull(),
    /** 'homepage' | 'landing' | 'campaign' | 'blog' | 'policy' | 'influencer' | 'custom' */
    kind: varchar("kind", { length: 30 }).notNull().default("custom"),
    /** Current published JSON layout */
    layout: json("layout"),
    /** Scheduled publish time */
    publishAt: timestamp("publish_at", { withTimezone: true }),
    isPublished: boolean("is_published").default(false),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    seoImage: varchar("seo_image", { length: 1024 }),
    /** Custom <head> additions */
    customHead: text("custom_head"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("cms_pages_store_idx").on(t.storeId),
    uniqueIndex("cms_pages_slug_store_uniq").on(t.storeId, t.slug),
  ],
);

// ── CMS: section instances (block instances on a page) ────────────────────────
export const cmsPageBlocksTable = pgTable(
  "cms_page_blocks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pageId: uuid("page_id")
      .notNull()
      .references(() => cmsPagesTable.id, { onDelete: "cascade" }),
    /** References cms_block_definitions.id for reusable blocks; null for inline blocks */
    definitionId: uuid("definition_id").references(() => cmsBlockDefinitionsTable.id, { onDelete: "set null" }),
    blockType: varchar("block_type", { length: 50 }).notNull(),
    /** JSON settings for this block instance */
    settings: json("settings").$type<Record<string, unknown>>(),
    sortOrder: integer("sort_order").default(0),
    enabled: boolean("enabled").default(true),
    showOnDesktop: boolean("show_on_desktop").default(true),
    showOnMobile: boolean("show_on_mobile").default(true),
    /** Background color, spacing tokens, custom styles */
    styles: json("styles").$type<Record<string, string>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("cms_page_blocks_page_idx").on(t.pageId)],
);

// ── CMS: revision history for pages ────────────────────────────────────────────
export const cmsRevisionsTable = pgTable(
  "cms_revisions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    pageId: uuid("page_id")
      .notNull()
      .references(() => cmsPagesTable.id, { onDelete: "cascade" }),
    /** Snapshot of the full layout JSON at this revision */
    layoutSnapshot: json("layout_snapshot").$type<CmsLayout>(),
    /** Auto-save = 'autosave', manual save = 'draft', publish = 'published' */
    type: varchar("type", { length: 20 }).default("autosave"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("cms_revisions_page_idx").on(t.pageId)],
);

// ── CMS: reusable content blocks (snippets, partials) ─────────────────────────
export const cmsSnippetsTable = pgTable(
  "cms_snippets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    /** JSON content for the snippet */
    content: json("content").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("cms_snippets_store_idx").on(t.storeId),
    uniqueIndex("cms_snippets_name_store_uniq").on(t.storeId, t.name),
  ],
);

// ── CMS: section templates (saved layouts for reuse) ──────────────────────────
export const cmsTemplatesTable = pgTable(
  "cms_templates",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    /** Layout JSON for this template */
    layout: json("layout"),
    /** 'store' | 'platform' */
    scope: varchar("scope", { length: 20 }).default("store"),
    usageCount: integer("usage_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("cms_templates_store_idx").on(t.storeId),
    uniqueIndex("cms_templates_name_store_uniq").on(t.storeId, t.name),
  ],
);

// ── CMS: content translations ─────────────────────────────────────────────────
export const cmsTranslationsTable = pgTable(
  "cms_translations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    /** 'page' | 'snippet' | 'block' | 'template' */
    resourceType: varchar("resource_type", { length: 30 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    locale: varchar("locale", { length: 10 }).notNull(),
    /** Translated JSON content */
    content: json("content").default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("cms_translations_store_idx").on(t.storeId),
    index("cms_translations_resource_idx").on(t.resourceType, t.resourceId),
    uniqueIndex("cms_translations_uniq").on(t.storeId, t.resourceType, t.resourceId, t.locale),
  ],
);

// ── CMS: media assets (image, video, file references) ───────────────────────────
export const cmsMediaTable = pgTable(
  "cms_media",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    storeId: uuid("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 1024 }).notNull(),
    filename: varchar("filename", { length: 255 }),
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"),
    width: integer("width"),
    height: integer("height"),
    alt: varchar("alt", { length: 255 }),
    /** 'image' | 'video' | 'file' */
    kind: varchar("kind", { length: 20 }).default("image"),
    /** JSON metadata from CDN/AI processing */
    metadata: json("metadata").default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("cms_media_store_idx").on(t.storeId)],
);


