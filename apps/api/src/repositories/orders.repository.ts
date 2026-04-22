import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, couponsTable, ordersTable, productsTable } from "../db";

type OrderFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

export async function createOrder(data: typeof ordersTable.$inferInsert) {
  const [order] = await db.insert(ordersTable).values(data).returning();
  return order;
}

export async function findOrdersByStore(storeId: string, filters: OrderFilters) {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? DEFAULT_PAGE_SIZE, 500);
  const offset = (page - 1) * pageSize;

  return db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.storeId, storeId),
        filters.status ? eq(ordersTable.orderStatus, filters.status) : undefined,
        filters.search
          ? or(
              ilike(ordersTable.customerName, `%${filters.search}%`),
              ilike(ordersTable.customerPhone, `%${filters.search}%`),
              ilike(ordersTable.id, `%${filters.search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(ordersTable.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function findOrderById(id: string) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  return order ?? null;
}

export async function updateOrderStatus(id: string, status: string) {
  const [order] = await db
    .update(ordersTable)
    .set({ orderStatus: status })
    .where(eq(ordersTable.id, id))
    .returning();
  return order ?? null;
}

export async function trackOrder(orderId?: string, phone?: string) {
  const whereClause =
    orderId && phone
      ? and(eq(ordersTable.id, orderId), eq(ordersTable.customerPhone, phone))
      : orderId
        ? eq(ordersTable.id, orderId)
        : phone
          ? eq(ordersTable.customerPhone, phone)
          : undefined;

  if (!whereClause) return null;

  const [order] = await db.select().from(ordersTable).where(whereClause).orderBy(desc(ordersTable.createdAt)).limit(1);
  return order ?? null;
}

export async function getOrderStats(storeId: string) {
  const [stats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
      pendingOrders: sql<number>`count(*) filter (where ${ordersTable.orderStatus} = 'new')::int`,
      newOrders: sql<number>`count(*) filter (where ${ordersTable.orderStatus} = 'new')::int`,
      confirmedOrders: sql<number>`count(*) filter (where ${ordersTable.orderStatus} = 'confirmed')::int`,
      shippedOrders: sql<number>`count(*) filter (where ${ordersTable.orderStatus} in ('shipped', 'out_for_delivery'))::int`,
      deliveredOrders: sql<number>`count(*) filter (where ${ordersTable.orderStatus} = 'delivered')::int`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.storeId, storeId));

  return {
    totalOrders: stats?.totalOrders ?? 0,
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    pendingOrders: stats?.pendingOrders ?? 0,
    newOrders: stats?.newOrders ?? 0,
    confirmedOrders: stats?.confirmedOrders ?? 0,
    shippedOrders: stats?.shippedOrders ?? 0,
    deliveredOrders: stats?.deliveredOrders ?? 0,
  };
}

export async function findProductsByIds(storeId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.storeId, storeId), sql`${productsTable.id} = ANY(${ids})`));
}

export async function reduceProductStock(productId: string, qty: number) {
  await db
    .update(productsTable)
    .set({ stock: sql`greatest(${productsTable.stock} - ${qty}, 0)` })
    .where(eq(productsTable.id, productId));
}

export async function findValidCoupon(storeId: string, code: string) {
  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(and(eq(couponsTable.storeId, storeId), eq(couponsTable.code, code), eq(couponsTable.isActive, true)))
    .limit(1);
  return coupon ?? null;
}

export async function incrementCouponUsedCount(couponId: string) {
  await db
    .update(couponsTable)
    .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
    .where(eq(couponsTable.id, couponId));
}

