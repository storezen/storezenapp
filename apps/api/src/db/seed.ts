import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
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

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? "admin@storepk.com";
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
  return created;
}

async function ensureDemoStore() {
  const demoEmail = "demo@storepk.com";
  const demoPassword = "demo12345";
  const demoName = "Demo Owner";

  let [owner] = await db.select().from(usersTable).where(eq(usersTable.email, demoEmail)).limit(1);
  if (!owner) {
    const hashed = await bcrypt.hash(demoPassword, SALT_ROUNDS);
    [owner] = await db
      .insert(usersTable)
      .values({
        name: demoName,
        email: demoEmail,
        password: hashed,
        plan: "free",
        isActive: true,
      })
      .returning();
  }

  const baseSlug = "demo";
  const [existingStore] = await db.select().from(storesTable).where(eq(storesTable.slug, baseSlug)).limit(1);
  if (existingStore) return existingStore;

  const [store] = await db
    .insert(storesTable)
    .values({
      id: randomUUID(),
      userId: owner.id,
      name: "Demo Store",
      slug: baseSlug,
      isActive: true,
    })
    .returning();

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
}

async function run() {
  const admin = await ensureAdminUser();
  const store = await ensureDemoStore();
  await ensureDemoProducts(store.id);

  console.log("Seed completed.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Demo store: ${store.slug}`);
}

run()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await pool.end();
    process.exit(1);
  });
