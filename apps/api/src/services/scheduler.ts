import cron from "node-cron";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { sendDailyReport } from "@storepk/whatsapp";
import { db, ordersTable, storesTable } from "../db";
import { logger } from "../lib/logger";

async function sendDailyReports() {
  const stores = await db
    .select()
    .from(storesTable)
    .where(and(eq(storesTable.isActive, true), sql`${storesTable.whatsappInstance} is not null`, sql`${storesTable.whatsappApiKey} is not null`));

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  for (const store of stores) {
    const [stats] = await db
      .select({
        orders: sql<number>`count(*)::int`,
        delivered: sql<number>`count(*) filter (where ${ordersTable.orderStatus} = 'delivered')::int`,
        revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)::text`,
      })
      .from(ordersTable)
      .where(and(eq(ordersTable.storeId, store.id), gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));

    await sendDailyReport(
      {
        date: now.toISOString().slice(0, 10),
        orders: stats?.orders ?? 0,
        delivered: stats?.delivered ?? 0,
        revenue: Number(stats?.revenue ?? 0),
      },
      {
        id: store.id,
        name: store.name,
        ownerPhone: store.whatsappNumber ?? undefined,
        whatsappInstanceId: store.whatsappInstance ?? undefined,
        whatsappToken: store.whatsappApiKey ?? undefined,
      },
    );
  }
}

async function syncShipmentStatuses() {
  logger.info("Shipment sync tick (Phase 4 placeholder)");
}

export function startScheduler() {
  cron.schedule("0 21 * * *", () => {
    void sendDailyReports();
  });

  cron.schedule("*/30 * * * *", () => {
    void syncShipmentStatuses();
  });

  logger.info("Scheduler started");
}
