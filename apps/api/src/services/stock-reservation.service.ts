import { eq, and, lt, sql } from "drizzle-orm";
import { db, stockReservationsTable } from "../db";

const RESERVATION_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function reserveStock(productId: string, storeId: string, sessionId: string, quantity: number) {
  // Expire any old reservations for this product
  await db
    .update(stockReservationsTable)
    .set({ status: "expired" })
    .where(
      and(
        eq(stockReservationsTable.productId, productId),
        eq(stockReservationsTable.status, "pending"),
        lt(stockReservationsTable.expiresAt, new Date()),
      ),
    );

  // Sum existing reservations
  const reserved = await db
    .select({
      total: sql<number>`coalesce(sum(${stockReservationsTable.quantity}), 0)::int`,
    })
    .from(stockReservationsTable)
    .where(
      and(
        eq(stockReservationsTable.productId, productId),
        eq(stockReservationsTable.status, "pending"),
      ),
    );

  const reservedQty = reserved[0]?.total ?? 0;
  const availableQty = Math.max(0, reservedQty); // Would need actual stock from product

  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
  const [row] = await db
    .insert(stockReservationsTable)
    .values({
      productId,
      storeId,
      sessionId,
      quantity,
      status: "pending",
      reservedAt: new Date(),
      expiresAt,
    })
    .returning();

  return { ...row, ttlMs: RESERVATION_TTL_MS };
}

export async function confirmReservation(reservationId: string) {
  const [row] = await db
    .update(stockReservationsTable)
    .set({ status: "confirmed" })
    .where(eq(stockReservationsTable.id, reservationId))
    .returning();
  return row;
}

export async function expireReservation(reservationId: string) {
  const [row] = await db
    .update(stockReservationsTable)
    .set({ status: "expired" })
    .where(eq(stockReservationsTable.id, reservationId))
    .returning();
  return row;
}

export async function getActiveReservations(sessionId: string) {
  return db
    .select()
    .from(stockReservationsTable)
    .where(
      and(
        eq(stockReservationsTable.sessionId, sessionId),
        eq(stockReservationsTable.status, "pending"),
      ),
    );
}

export async function getAvailableStock(productId: string) {
  const [reservation] = await db
    .select({
      reserved: sql<number>`coalesce(sum(${stockReservationsTable.quantity}), 0)::int`,
    })
    .from(stockReservationsTable)
    .where(
      and(
        eq(stockReservationsTable.productId, productId),
        eq(stockReservationsTable.status, "pending"),
        lt(stockReservationsTable.expiresAt, new Date()),
      ),
    );

  return { reserved: reservation?.reserved ?? 0 };
}
