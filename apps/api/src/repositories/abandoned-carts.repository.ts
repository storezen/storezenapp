import { and, desc, eq, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { abandonedCartsTable, db } from "../db";

export async function insertAbandonedCart(data: typeof abandonedCartsTable.$inferInsert) {
  const [row] = await db.insert(abandonedCartsTable).values(data).returning();
  return row ?? null;
}

export async function listDueForReminder(params: { olderThanMinutes: number; limit: number }) {
  const cutoff = new Date(Date.now() - params.olderThanMinutes * 60_000);
  return db
    .select()
    .from(abandonedCartsTable)
    .where(
      and(
        eq(abandonedCartsTable.recovered, false),
        isNull(abandonedCartsTable.reminderSentAt),
        lt(abandonedCartsTable.createdAt, cutoff),
        sql`coalesce(jsonb_array_length(${abandonedCartsTable.items}::jsonb), 0) > 0`,
        isNotNull(abandonedCartsTable.customerPhone),
      ),
    )
    .orderBy(desc(abandonedCartsTable.createdAt))
    .limit(params.limit);
}

export async function markReminderSent(id: string) {
  const [row] = await db
    .update(abandonedCartsTable)
    .set({ reminderSentAt: new Date() })
    .where(eq(abandonedCartsTable.id, id))
    .returning();
  return row ?? null;
}

export async function markRecoveredByPhone(storeId: string, phone: string) {
  const clean = phone.replace(/\D/g, "");
  if (!clean) return 0;
  const res = await db
    .update(abandonedCartsTable)
    .set({ recovered: true })
    .where(
      and(
        eq(abandonedCartsTable.storeId, storeId),
        sql`regexp_replace(${abandonedCartsTable.customerPhone}, '[^0-9]', '', 'g') = ${clean}`,
      ),
    );
  return res.rowCount ?? 0;
}

export async function getAbandonedCarts(storeId: string) {
  return db
    .select()
    .from(abandonedCartsTable)
    .where(eq(abandonedCartsTable.storeId, storeId))
    .orderBy(desc(abandonedCartsTable.createdAt));
}

export async function recoverCart(id: string) {
  await db
    .update(abandonedCartsTable)
    .set({ recovered: true })
    .where(eq(abandonedCartsTable.id, id));
}
