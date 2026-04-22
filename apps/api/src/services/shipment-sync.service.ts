import { trackShipping } from "@storepk/shipping";
import { eq, ne } from "drizzle-orm";
import { db, shipmentsTable, storesTable } from "../db";
import { logger } from "../lib/logger";

function shippingApiKeyFromStore(
  store: typeof storesTable.$inferSelect,
  courier: string,
): string {
  const deliverySettings =
    store.deliverySettings && typeof store.deliverySettings === "object"
      ? (store.deliverySettings as Record<string, unknown>)
      : {};
  const shippingSettings =
    deliverySettings.shipping && typeof deliverySettings.shipping === "object"
      ? (deliverySettings.shipping as Record<string, unknown>)
      : {};
  const credsByCourier =
    shippingSettings.couriers && typeof shippingSettings.couriers === "object"
      ? (shippingSettings.couriers as Record<string, unknown>)
      : {};
  const credsFor = credsByCourier[courier];
  const creds = credsFor && typeof credsFor === "object" ? (credsFor as Record<string, unknown>) : {};
  return String(creds.apiKey ?? "");
}

/** Background job: sync tracking for all non-delivered shipments (all stores). */
export async function syncAllShipmentStatuses(): Promise<{ scanned: number; updated: number }> {
  const shipments = await db
    .select()
    .from(shipmentsTable)
    .where(ne(shipmentsTable.status, "delivered"));

  let updated = 0;
  for (const shipment of shipments) {
    if (!shipment.trackingNumber || !shipment.courier) continue;

    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, shipment.storeId)).limit(1);
    if (!store) continue;

    const apiKey = shippingApiKeyFromStore(store, shipment.courier);
    if (!apiKey) continue;

    try {
      const tracked = await trackShipping(shipment.courier as "postex" | "leopards", shipment.trackingNumber, {
        apiKey,
      });
      await db
        .update(shipmentsTable)
        .set({
          status: tracked.status,
          rawStatus: tracked as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(shipmentsTable.id, shipment.id));
      updated += 1;
    } catch (err) {
      logger.warn({ err, shipmentId: shipment.id }, "Shipment sync failed for row");
    }
  }

  logger.info({ scanned: shipments.length, updated }, "Shipment sync tick");
  return { scanned: shipments.length, updated };
}
