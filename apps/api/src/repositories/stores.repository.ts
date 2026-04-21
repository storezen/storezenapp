import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, ordersTable, productsTable, storePagesTable, storesTable } from "../db";

export async function findStoreBySlug(slug: string) {
  const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
  return store ?? null;
}

export async function findStoreByUserId(userId: string) {
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
  return store ?? null;
}

export async function findStoreById(id: string) {
  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, id)).limit(1);
  return store ?? null;
}

export async function updateStoreById(id: string, data: Partial<typeof storesTable.$inferInsert>) {
  const [store] = await db.update(storesTable).set(data).where(eq(storesTable.id, id)).returning();
  return store ?? null;
}

export async function upsertStorePages(storeId: string, homeBlocks: unknown[]) {
  const [existing] = await db.select().from(storePagesTable).where(eq(storePagesTable.storeId, storeId)).limit(1);
  if (existing) {
    const [row] = await db
      .update(storePagesTable)
      .set({ homeBlocks, updatedAt: new Date() })
      .where(eq(storePagesTable.storeId, storeId))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(storePagesTable)
    .values({
      id: randomUUID(),
      storeId,
      homeBlocks,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function getStorePages(storeId: string) {
  const [pages] = await db.select().from(storePagesTable).where(eq(storePagesTable.storeId, storeId)).limit(1);
  return pages ?? null;
}

export async function getStoreStats(storeId: string) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today] = await db
    .select({
      orders: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
    })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, storeId), gte(ordersTable.createdAt, dayStart), lte(ordersTable.createdAt, now)));

  const [month] = await db
    .select({
      orders: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
    })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, storeId), gte(ordersTable.createdAt, monthStart), lte(ordersTable.createdAt, now)));

  const [productsAgg] = await db
    .select({
      totalProducts: sql<number>`count(*)::int`,
      lowStock: sql<number>`count(*) filter (where ${productsTable.stock} <= ${productsTable.lowStockThreshold})::int`,
    })
    .from(productsTable)
    .where(eq(productsTable.storeId, storeId));

  const [pendingAgg] = await db
    .select({
      pendingOrders: sql<number>`count(*) filter (where ${ordersTable.orderStatus} = 'new')::int`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.storeId, storeId));

  return {
    todayOrders: today?.orders ?? 0,
    todayRevenue: Number(today?.revenue ?? 0),
    monthOrders: month?.orders ?? 0,
    monthRevenue: Number(month?.revenue ?? 0),
    totalProducts: productsAgg?.totalProducts ?? 0,
    pendingOrders: pendingAgg?.pendingOrders ?? 0,
    lowStockCount: productsAgg?.lowStock ?? 0,
  };
}

