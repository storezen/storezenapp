import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, storesTable, usersTable } from "../db";

async function run() {
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required");
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  if (existing) {
    console.log("Admin already exists:", adminEmail);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      name: adminName,
      email: adminEmail,
      password: hashed,
      plan: "admin",
    })
    .returning();

  const baseSlug = adminName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "admin-store";
  const [store] = await db
    .insert(storesTable)
    .values({
      id: randomUUID(),
      userId: user.id,
      name: `${adminName}'s Store`,
      slug: `${baseSlug}-${Date.now().toString().slice(-6)}`,
    })
    .returning();

  console.log("Seeded admin user:", user.email);
  console.log("Created store:", store.slug);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

