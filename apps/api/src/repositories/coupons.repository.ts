import { and, eq } from "drizzle-orm";
import { db, couponsTable } from "../db";

export async function createCoupon(data: typeof couponsTable.$inferInsert) {
  const [coupon] = await db.insert(couponsTable).values(data).returning();
  return coupon;
}

export async function listCouponsByStore(storeId: string) {
  return db.select().from(couponsTable).where(eq(couponsTable.storeId, storeId));
}

export async function findCouponById(id: string) {
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.id, id)).limit(1);
  return coupon ?? null;
}

export async function findCouponByCode(storeId: string, code: string) {
  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(and(eq(couponsTable.storeId, storeId), eq(couponsTable.code, code)))
    .limit(1);
  return coupon ?? null;
}

export async function updateCoupon(id: string, data: Partial<typeof couponsTable.$inferInsert>) {
  const [coupon] = await db.update(couponsTable).set(data).where(eq(couponsTable.id, id)).returning();
  return coupon ?? null;
}

export async function deleteCoupon(id: string) {
  const [coupon] = await db.delete(couponsTable).where(eq(couponsTable.id, id)).returning();
  return coupon ?? null;
}

