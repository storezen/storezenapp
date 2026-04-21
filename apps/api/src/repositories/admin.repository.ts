import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db, ordersTable, platformSettingsTable, storesTable, usersTable } from "../db";

type ListFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
};

function pagination(filters: ListFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

export async function getAdminStats() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [storesAgg] = await db
    .select({
      totalStores: sql<number>`count(*)::int`,
      activeStores: sql<number>`count(*) filter (where ${storesTable.isActive} = true)::int`,
    })
    .from(storesTable);

  const [ordersToday] = await db
    .select({
      totalOrdersToday: sql<number>`count(*)::int`,
      totalRevenueToday: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
    })
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, dayStart), lte(ordersTable.createdAt, now)));

  const [ordersMonth] = await db
    .select({
      totalOrdersMonth: sql<number>`count(*)::int`,
      totalRevenueMonth: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
    })
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, monthStart), lte(ordersTable.createdAt, now)));

  const [usersToday] = await db
    .select({
      newSignupsToday: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .where(and(gte(usersTable.createdAt, dayStart), lte(usersTable.createdAt, now)));

  const [usersMonth] = await db
    .select({
      newSignupsMonth: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .where(and(gte(usersTable.createdAt, monthStart), lte(usersTable.createdAt, now)));

  const growth = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${ordersTable.createdAt}), 'YYYY-MM-DD')`,
      orders: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
    })
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), lte(ordersTable.createdAt, now)))
    .groupBy(sql`date_trunc('day', ${ordersTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${ordersTable.createdAt}) asc`);

  return {
    totalStores: storesAgg?.totalStores ?? 0,
    activeStores: storesAgg?.activeStores ?? 0,
    totalOrdersToday: ordersToday?.totalOrdersToday ?? 0,
    totalOrdersMonth: ordersMonth?.totalOrdersMonth ?? 0,
    totalRevenueToday: Number(ordersToday?.totalRevenueToday ?? 0),
    totalRevenueMonth: Number(ordersMonth?.totalRevenueMonth ?? 0),
    newSignupsToday: usersToday?.newSignupsToday ?? 0,
    newSignupsMonth: usersMonth?.newSignupsMonth ?? 0,
    growth: growth.map((g) => ({ day: g.day, orders: Number(g.orders ?? 0), revenue: Number(g.revenue ?? 0) })),
  };
}

export async function listAdminStores(filters: ListFilters) {
  const { pageSize, offset } = pagination(filters);
  return db
    .select({
      id: storesTable.id,
      name: storesTable.name,
      slug: storesTable.slug,
      isActive: storesTable.isActive,
      createdAt: storesTable.createdAt,
      ownerId: usersTable.id,
      ownerName: usersTable.name,
      ownerEmail: usersTable.email,
      ownerPlan: usersTable.plan,
      ownerActive: usersTable.isActive,
    })
    .from(storesTable)
    .leftJoin(usersTable, eq(usersTable.id, storesTable.userId))
    .where(
      and(
        filters.status ? eq(storesTable.isActive, filters.status === "active") : undefined,
        filters.search
          ? or(ilike(storesTable.name, `%${filters.search}%`), ilike(storesTable.slug, `%${filters.search}%`), ilike(usersTable.email, `%${filters.search}%`))
          : undefined,
      ),
    )
    .orderBy(desc(storesTable.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function findStoreById(id: string) {
  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, id)).limit(1);
  return store ?? null;
}

export async function toggleStoreActive(id: string) {
  const store = await findStoreById(id);
  if (!store) return null;
  const [updated] = await db
    .update(storesTable)
    .set({ isActive: !store.isActive })
    .where(eq(storesTable.id, id))
    .returning();
  return updated ?? null;
}

export async function updateOwnerPlanByStoreId(storeId: string, plan: string) {
  const store = await findStoreById(storeId);
  if (!store) return null;
  const [updatedUser] = await db.update(usersTable).set({ plan }).where(eq(usersTable.id, store.userId)).returning();
  return updatedUser ?? null;
}

export async function listAdminUsers(filters: Omit<ListFilters, "status">) {
  const { pageSize, offset } = pagination(filters);
  return db
    .select()
    .from(usersTable)
    .where(
      filters.search
        ? or(ilike(usersTable.name, `%${filters.search}%`), ilike(usersTable.email, `%${filters.search}%`))
        : undefined,
    )
    .orderBy(desc(usersTable.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return user ?? null;
}

export async function toggleUserBan(id: string) {
  const user = await findUserById(id);
  if (!user) return null;
  const [updated] = await db
    .update(usersTable)
    .set({ isActive: !user.isActive })
    .where(eq(usersTable.id, id))
    .returning();
  return updated ?? null;
}

export async function updateUserPlan(id: string, plan: string) {
  const user = await findUserById(id);
  if (!user) return null;
  const [updated] = await db.update(usersTable).set({ plan }).where(eq(usersTable.id, id)).returning();
  return updated ?? null;
}

export async function getPlatformSettings() {
  const [settings] = await db.select().from(platformSettingsTable).limit(1);
  if (settings) return settings;
  const [created] = await db.insert(platformSettingsTable).values({}).returning();
  return created;
}

export async function updatePlatformSettings(input: { maintenanceMode?: boolean; settings?: Record<string, unknown> }) {
  const current = await getPlatformSettings();
  const [updated] = await db
    .update(platformSettingsTable)
    .set({
      maintenanceMode: input.maintenanceMode ?? current.maintenanceMode ?? false,
      settings: input.settings ?? (current.settings as Record<string, unknown>) ?? {},
      updatedAt: new Date(),
    })
    .where(eq(platformSettingsTable.id, current.id))
    .returning();
  return updated ?? current;
}

