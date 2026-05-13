/**
 * One-off / dev-only: enrich the demo store with many products, collections, and sample orders
 * for a production-like admin experience. Idempotent: skips if the store already has many rows.
 *
 *   pnpm run db:seed:bulk   (from repo root, loads .env)
 *   # or: cd apps/api && pnpm run db:seed:bulk
 *
 * Env (all optional, integers where noted):
 *   STORE_SLUG              default demo
 *   BULK_TARGET_PRODUCTS    product rows to reach (default 100)
 *   BULK_TARGET_ORDERS      order rows to reach (default 120)
 *   BULK_TARGET_COLLECTIONS when none exist, how many to create (default 12, max built-in list)
 *   BULK_SKIP_IF_PRODUCTS_GTE  skip whole run if count >= this and orders gte (default 80)
 *   BULK_SKIP_IF_ORDERS_GTE  skip whole run if count >= this and products gte (default 100)
 */
import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import {
  db,
  marketingCampaignsTable,
  pool,
  ordersTable,
  productsTable,
  storeAnalyticsDailyTable,
  storeCollectionProductsTable,
  storeCollectionsTable,
  storesTable,
} from "./index";
import { logger } from "../lib/logger";

const ORDER_STATUSES = [
  "new",
  "new",
  "confirmed",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "delivered",
  "delivered",
  "cancelled",
] as const;

const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Sialkot",
  "Rawalpindi",
  "Hyderabad",
  "Quetta",
  "Gujranwala",
] as const;

const FIRST = [
  "Ahmed",
  "Fatima",
  "Bilal",
  "Ayesha",
  "Ali",
  "Sana",
  "Omar",
  "Zainab",
  "Usman",
  "Hira",
  "Khan",
  "Mariam",
] as const;
const LAST = [
  "Khan",
  "Sheikh",
  "Malik",
  "Raza",
  "Hussain",
  "Abbas",
  "Iqbal",
  "Bukhari",
  "Butt",
  "Ansari",
  "Rehman",
  "Nadeem",
] as const;

const COLLECTIONS = [
  { name: "New arrivals", desc: "Fresh drops this week." },
  { name: "Bestsellers", desc: "What shoppers love the most." },
  { name: "Mobile accessories", desc: "Cases, cables, and more." },
  { name: "Audio & earphones", desc: "Clear sound, everyday use." },
  { name: "Watches", desc: "Timepieces and smart wearables." },
  { name: "Back to school", desc: "Bags, bottles, and basics." },
  { name: "Home essentials", desc: "Small upgrades for home." },
  { name: "Gifts under Rs. 2,000", desc: "Perfect add-ons to cart." },
  { name: "Sports & outdoor", desc: "Gear for an active day." },
  { name: "Health & self-care", desc: "Wellness and daily care." },
  { name: "Laptop & desk", desc: "Productivity and protection." },
  { name: "Clearance", desc: "Last sizes and limited stock." },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function rndInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function envInt(name: string, def: number) {
  const v = process.env[name];
  if (v == null || v === "") return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function productTemplates(n: number) {
  const cats = [
    "Electronics",
    "Mobile & accessories",
    "Fashion",
    "Home & living",
    "Health & beauty",
    "Sports",
    "Watches & wearables",
  ];
  const titles = (i: number) => {
    const c = pick(cats);
    const label = [
      `Wireless Earbuds Pro ${i}`,
      `Cotton T-Shirt — Pack ${i}`,
      `Stainless Water Bottle 750ml #${i}`,
      `Laptop Stand Aluminum ${i}`,
      `Leather Card Holder ${i}`,
      `Smart Watch Strap #${i}`,
      `Phone Case Shockproof #${i}`,
      `Power Bank 20000mAh ${i}`,
      `Desk Lamp LED ${i}`,
      `Cotton Tote Bag ${i}`,
    ];
    return { name: pick(label) + (i > 0 ? ` (${i})` : ""), category: c };
  };
  const out: { id: string; name: string; slug: string; category: string; price: string; salePrice: string | null; stock: number; images: string[] }[] = [];
  for (let i = 0; i < n; i++) {
    const t = titles(i);
    const id = randomUUID();
    const base = 499 + Math.floor(Math.random() * 22000);
    const onSale = Math.random() < 0.35;
    out.push({
      id,
      name: t.name,
      slug: `${slugify(t.name)}-${id.slice(0, 8)}`,
      category: t.category,
      price: String(base),
      salePrice: onSale ? String(Math.max(1, Math.floor(base * (0.75 + Math.random() * 0.15)))) : null,
      stock: rndInt(0, 180),
      images: [`https://picsum.photos/seed/${encodeURIComponent(t.name + id)}/600/600`],
    });
  }
  return out;
}

/**
 * Realistic line-item shape (same as order placement).
 */
type LineItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function buildFakeOrder(productIds: { id: string; name: string; price: string; salePrice: string | null }[]) {
  const nLines = Math.min(3, rndInt(1, 3));
  const lines: LineItem[] = [];
  for (let j = 0; j < nLines; j++) {
    const p = pick(productIds);
    const unit = Math.round(Number(p.salePrice ?? p.price) || 0);
    const qty = rndInt(1, 2);
    lines.push({
      productId: p.id,
      name: p.name,
      quantity: qty,
      unitPrice: unit,
      lineTotal: unit * qty,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const city = pick(PK_CITIES);
  const deliveryFee = ["Karachi", "Lahore", "Islamabad"].includes(city) ? 200 : ["Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Gujranwala", "Sialkot", "Hyderabad"].includes(city) ? 250 : 350;
  const total = subtotal + deliveryFee;
  const st = pick(ORDER_STATUSES);
  const daysAgo = rndInt(0, 90);
  const created = new Date();
  created.setDate(created.getDate() - daysAgo);
  created.setHours(rndInt(8, 21), rndInt(0, 59), 0, 0);
  const fn = pick(FIRST);
  const ln = pick(LAST);
  return {
    id: randomUUID(),
    customerName: `${fn} ${ln}`,
    customerPhone: `03${String(100000000 + Math.floor(Math.random() * 899999999))}`,
    customerCity: city,
    customerAddress: `House ${rndInt(1, 200)}, ${pick(["Block A", "Block B", "Phase 1", "Street 4"])}, ${city}`,
    items: lines,
    subtotal: String(subtotal),
    deliveryFee: String(deliveryFee),
    discount: "0",
    total: String(total),
    orderStatus: st,
    paymentStatus: st === "delivered" || st === "confirmed" || st === "shipped" || st === "out_for_delivery" ? "paid" : st === "cancelled" ? "unpaid" : "pending",
    paymentMethod: "cod",
    createdAt: created,
  };
}

export async function runBulkDemoSeed() {
  const slug = (process.env.STORE_SLUG ?? "demo").trim() || "demo";
  const wantProducts = envInt("BULK_TARGET_PRODUCTS", 100);
  const wantOrders = envInt("BULK_TARGET_ORDERS", 120);
  const wantCollections = Math.min(COLLECTIONS.length, Math.max(0, envInt("BULK_TARGET_COLLECTIONS", 12)));
  const skipIfProductsGte = envInt("BULK_SKIP_IF_PRODUCTS_GTE", 80);
  const skipIfOrdersGte = envInt("BULK_SKIP_IF_ORDERS_GTE", 100);

  logger.info(
    { wantProducts, wantOrders, wantCollections, skipIfProductsGte, skipIfOrdersGte, slug },
    "Bulk demo config",
  );

  const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
  if (!store) {
    logger.warn({ slug }, "No store with this slug; run normal db:seed first or set STORE_SLUG");
    return;
  }

  await ensureDemoAnalyticsStore(store.id);
  await ensureDemoCampaignsStore(store.id);

  const [prodCountRow] = await db.select({ n: count() }).from(productsTable).where(eq(productsTable.storeId, store.id));
  const [ordCountRow] = await db.select({ n: count() }).from(ordersTable).where(eq(ordersTable.storeId, store.id));
  const pCount = Number(prodCountRow?.n ?? 0);
  const oCount = Number(ordCountRow?.n ?? 0);
  if (pCount >= skipIfProductsGte && oCount >= skipIfOrdersGte) {
    logger.info(
      { storeId: store.id, products: pCount, orders: oCount, skipIfProductsGte, skipIfOrdersGte },
      "Bulk demo products/orders already present; skip bulk insert",
    );
    return;
  }

  const targetProducts = Math.max(0, wantProducts - pCount);
  const targetOrders = Math.max(0, wantOrders - oCount);
  if (targetProducts === 0 && targetOrders === 0) {
    return;
  }

  const newProducts = productTemplates(targetProducts);
  if (newProducts.length > 0) {
    await db.insert(productsTable).values(
      newProducts.map((row) => ({
        id: row.id,
        storeId: store.id,
        name: row.name,
        slug: row.slug,
        description: `Demolist item — ${row.category}. Seeded for admin preview.`,
        price: row.price,
        salePrice: row.salePrice,
        stock: row.stock,
        lowStockThreshold: 5,
        images: row.images,
        category: row.category,
        tags: [row.category, "seed"],
        isActive: true,
        isDraft: false,
        isFeatured: false,
        sku: `BULK-${row.id.slice(0, 8)}`,
        trackInventory: true,
      })),
    );
    logger.info({ n: newProducts.length }, "Inserted bulk demo products");
  }

  const allProds = await db
    .select({ id: productsTable.id, name: productsTable.name, price: productsTable.price, salePrice: productsTable.salePrice })
    .from(productsTable)
    .where(eq(productsTable.storeId, store.id));
  if (allProds.length < 2) {
    logger.warn("Not enough products to seed orders; stopping");
    return;
  }

  const [cc] = await db.select({ n: count() }).from(storeCollectionsTable).where(eq(storeCollectionsTable.storeId, store.id));
  if (Number(cc?.n ?? 0) === 0) {
    const toCreate = wantCollections;
    for (let i = 0; i < toCreate; i++) {
      const c = COLLECTIONS[i]!;
      const id = randomUUID();
      const colSlug = `${slugify(c.name)}-${id.slice(0, 6)}`;
      await db.insert(storeCollectionsTable).values({
        id,
        storeId: store.id,
        name: c.name,
        slug: colSlug,
        description: c.desc,
        image: `https://picsum.photos/seed/${encodeURIComponent(c.name)}/800/400`,
        sortOrder: i,
        isActive: true,
        collectionKind: "manual",
      });
      const shuffled = [...allProds].sort(() => Math.random() - 0.5);
      const pickN = Math.min(12, shuffled.length);
      const ins = shuffled.slice(0, pickN).map((p, j) => ({
        collectionId: id,
        productId: p.id,
        sortOrder: j,
      }));
      await db.insert(storeCollectionProductsTable).values(ins);
    }
    logger.info("Inserted demo collections and membership");
  }

  if (targetOrders > 0) {
    const rows: (typeof ordersTable.$inferInsert)[] = [];
    for (let i = 0; i < targetOrders; i++) {
      const b = buildFakeOrder(allProds);
      rows.push({
        id: b.id,
        storeId: store.id,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerCity: b.customerCity,
        customerAddress: b.customerAddress,
        items: b.items,
        subtotal: b.subtotal,
        deliveryFee: b.deliveryFee,
        discount: b.discount,
        total: b.total,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        orderStatus: b.orderStatus,
        notes: "Demo / seeded order",
        createdAt: b.createdAt,
      });
    }
    await db.insert(ordersTable).values(rows);
    logger.info({ n: targetOrders }, "Inserted bulk demo orders");
  }

  logger.info("Bulk demo seed finished");
}

async function ensureDemoAnalyticsStore(storeId: string) {
  const [c] = await db.select({ n: count() }).from(storeAnalyticsDailyTable).where(eq(storeAnalyticsDailyTable.storeId, storeId));
  if (Number(c?.n ?? 0) > 5) return;

  const rows: (typeof storeAnalyticsDailyTable.$inferInsert)[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const o = rndInt(0, 15);
    const s = Math.max(o * 14, o > 0 ? 40 : 8);
    rows.push({
      id: randomUUID(),
      storeId,
      day: key,
      sessions: s,
      productViews: Math.round(s * 1.2),
      addToCarts: Math.round(s * 0.12),
      checkouts: Math.max(o, Math.round(s * 0.05)),
      ordersPlaced: o,
      revenue: String(o * rndInt(800, 3200) + (o > 0 ? rndInt(200, 900) : 0)),
    });
  }
  await db.insert(storeAnalyticsDailyTable).values(rows);
  logger.info({ n: rows.length, storeId }, "Seeded store_analytics_daily");
}

async function ensureDemoCampaignsStore(storeId: string) {
  const [c] = await db.select({ n: count() }).from(marketingCampaignsTable).where(eq(marketingCampaignsTable.storeId, storeId));
  if (Number(c?.n ?? 0) > 0) return;

  const demo: (typeof marketingCampaignsTable.$inferInsert)[] = [
    {
      id: randomUUID(),
      storeId,
      name: "Winter sale — lookalike",
      channel: "meta",
      status: "active",
      budget: "50000",
      spend: "12400",
      impressions: 128000,
      clicks: 4200,
      conversions: 89,
    },
    {
      id: randomUUID(),
      storeId,
      name: "TikTok spark collection",
      channel: "tiktok",
      status: "paused",
      budget: "25000",
      spend: "18200",
      impressions: 340000,
      clicks: 9100,
      conversions: 112,
    },
  ];
  await db.insert(marketingCampaignsTable).values(demo);
  logger.info({ n: demo.length, storeId }, "Seeded marketing_campaigns");
}

async function main() {
  try {
    await runBulkDemoSeed();
  } finally {
    await pool.end();
  }
}

void main();
