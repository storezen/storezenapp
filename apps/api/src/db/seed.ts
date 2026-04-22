import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger";
import { db, pool, productsTable, storesTable, usersTable } from "./index";

const SALT_ROUNDS = 10;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function countStores(): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(storesTable);
  return Number(row?.n ?? 0);
}

/** Ensures an admin user exists (by ADMIN_EMAIL). Creates only if missing. */
async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@storepk.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? "strong-password";
  const name = "Platform Admin";

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) return existing;

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const [created] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      password: hashed,
      plan: "admin",
      isActive: true,
    })
    .returning();
  logger.info({ email: created.email }, "Created admin user");
  return created;
}

/** If there are no stores at all, create Demo Store (slug `demo`) owned by the admin user. */
async function ensureDemoStore(adminUserId: string) {
  const baseSlug = "demo";
  const [existingDemo] = await db.select().from(storesTable).where(eq(storesTable.slug, baseSlug)).limit(1);
  if (existingDemo) return existingDemo;

  if ((await countStores()) > 0) {
    return null;
  }

  const [store] = await db
    .insert(storesTable)
    .values({
      id: randomUUID(),
      userId: adminUserId,
      name: "Demo Store",
      slug: baseSlug,
      isActive: true,
    })
    .returning();
  logger.info({ slug: store.slug }, "Created demo store");
  return store;
}

async function ensureDemoProducts(storeId: string) {
  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.storeId, storeId))
    .limit(1);
  if (existing) return;

  const demoProducts = [
    {
      id: randomUUID(),
      storeId,
      name: "Classic Cotton T-Shirt",
      slug: slugify("Classic Cotton T-Shirt"),
      description: "Breathable cotton t-shirt for everyday wear.",
      price: "2499",
      salePrice: "1999",
      stock: 50,
      category: "Clothing",
      images: ["https://placehold.co/600x600?text=T-Shirt"],
      isActive: true,
    },
    {
      id: randomUUID(),
      storeId,
      name: "Sport Running Shoes",
      slug: slugify("Sport Running Shoes"),
      description: "Lightweight comfort shoes for daily jogging.",
      price: "7999",
      salePrice: "6999",
      stock: 25,
      category: "Footwear",
      images: ["https://placehold.co/600x600?text=Shoes"],
      isActive: true,
    },
    {
      id: randomUUID(),
      storeId,
      name: "Minimal Leather Wallet",
      slug: slugify("Minimal Leather Wallet"),
      description: "Slim wallet with premium stitching.",
      price: "2999",
      salePrice: null,
      stock: 40,
      category: "Accessories",
      images: ["https://placehold.co/600x600?text=Wallet"],
      isActive: true,
    },
  ];

  await db.insert(productsTable).values(demoProducts);
  logger.info({ storeId, count: demoProducts.length }, "Seeded demo products");
}

/**
 * Idempotent seed: admin user (if missing), demo store (if no stores), sample products (if store empty).
 * When `users` is empty, runs full bootstrap (Railway fresh DB).
 */
export async function seedDatabase(): Promise<void> {
  const admin = await ensureAdminUser();
  if (!admin) {
    logger.warn("Could not resolve admin user; skipping demo store seed");
    return;
  }

  const store = await ensureDemoStore(admin.id);
  if (store) {
    await ensureDemoProducts(store.id);
  }

  logger.info("Seed step completed");
}

/** CLI: `pnpm run db:seed` */
async function runCli() {
  try {
    await seedDatabase();
  } finally {
    await pool.end();
  }
}

const isSeedCli =
  typeof process.argv[1] === "string" &&
  (process.argv[1].includes("seed") || process.argv[1].endsWith("seed.ts"));

if (isSeedCli && !process.argv[1].includes("seed-admin")) {
  runCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
