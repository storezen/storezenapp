import { randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { Router } from "express";
import { bookShipping, trackShipping } from "@storepk/shipping";
import { sendPickedUp } from "@storepk/whatsapp";
import { authenticate } from "../middlewares/authenticate";
import { db, ordersTable, shipmentsTable, storesTable } from "../db";
import { findStoreById } from "../repositories/stores.repository";
import { bookShippingSchema, syncShippingSchema, updateShippingSettingsSchema } from "../validators/shipping.validator";

const router = Router();

function isWhatsappEnabled() {
  const raw = process.env.WHATSAPP_ENABLED;
  if (!raw) return true;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

router.post("/shipping/book", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = bookShippingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ")  });
    const { orderId, courier } = parsed.data;

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.storeId, req.user.storeId)))
      .limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, req.user.storeId)).limit(1);
    if (!store) return res.status(404).json({ error: "Store not found" });
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
    const creds =
      credsFor && typeof credsFor === "object" ? (credsFor as Record<string, unknown>) : {};
    const apiKey = String(creds.apiKey ?? "");
    if (!apiKey) return res.status(400).json({ error: `Missing API key for ${courier}` });

    const booked = await bookShipping(
      courier,
      {
        id: order.id,
        total: Number(order.total ?? 0),
        customer_phone: order.customerPhone,
        customer_name: order.customerName,
        customer_address: order.customerAddress,
        customer_city: order.customerCity,
      },
      { apiKey },
    );

    const [shipment] = await db
      .insert(shipmentsTable)
      .values({
        id: randomUUID(),
        orderId: order.id,
        storeId: order.storeId,
        courier,
        trackingNumber: booked.tracking_number,
        bookingId: booked.booking_id,
        status: "booked",
        bookedAt: new Date(),
      })
      .returning();

    await db
      .update(ordersTable)
      .set({
        trackingNumber: booked.tracking_number,
        courier,
      })
      .where(eq(ordersTable.id, order.id));

    const [updatedOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
    if (updatedOrder && isWhatsappEnabled()) {
      const storeForWa = await findStoreById(updatedOrder.storeId);
      if (storeForWa?.whatsappInstance && storeForWa?.whatsappApiKey) {
        try {
          await sendPickedUp(
            {
              id: updatedOrder.id,
              total: String(updatedOrder.total ?? ""),
              customerName: updatedOrder.customerName,
              customerPhone: updatedOrder.customerPhone,
              storeId: updatedOrder.storeId,
            },
            {
              id: storeForWa.id,
              name: storeForWa.name,
              ownerPhone: storeForWa.whatsappNumber ?? undefined,
              whatsappInstanceId: storeForWa.whatsappInstance ?? undefined,
              whatsappToken: storeForWa.whatsappApiKey ?? undefined,
            },
          );
        } catch {
          // booking succeeded; WhatsApp is best-effort
        }
      }
    }

    return res.json({ shipment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to book shipment";
    return res.status(500).json({ error: msg });
  }
});

router.post("/shipping/sync", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = syncShippingSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ")  });
    const courierFilter = parsed.data.courier;
    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, req.user.storeId)).limit(1);
    if (!store) return res.status(404).json({ error: "Store not found" });
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

    const shipments = await db
      .select()
      .from(shipmentsTable)
      .where(
        and(
          eq(shipmentsTable.storeId, req.user.storeId),
          ne(shipmentsTable.status, "delivered"),
          courierFilter ? eq(shipmentsTable.courier, courierFilter) : undefined,
        ),
      );

    let updated = 0;
    for (const shipment of shipments) {
      if (!shipment.trackingNumber || !shipment.courier) continue;
      const credsFor = credsByCourier[shipment.courier];
      const creds =
        credsFor && typeof credsFor === "object" ? (credsFor as Record<string, unknown>) : {};
      const apiKey = String(creds.apiKey ?? "");
      if (!apiKey) continue;

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
    }
    return res.json({ synced: shipments.length, updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to sync shipments";
    return res.status(500).json({ error: msg });
  }
});

router.get("/shipping/settings", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, req.user.storeId)).limit(1);
    if (!store) return res.status(404).json({ error: "Store not found" });
    const deliverySettings =
      store.deliverySettings && typeof store.deliverySettings === "object"
        ? (store.deliverySettings as Record<string, unknown>)
        : {};
    return res.json({ shipping: deliverySettings.shipping ?? {} });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load shipping settings";
    return res.status(500).json({ error: msg });
  }
});

router.put("/shipping/settings", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = updateShippingSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ")  });
    const shipping = parsed.data.shipping ?? parsed.data;
    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, req.user.storeId)).limit(1);
    if (!store) return res.status(404).json({ error: "Store not found" });
    const deliverySettings =
      store.deliverySettings && typeof store.deliverySettings === "object"
        ? (store.deliverySettings as Record<string, unknown>)
        : {};
    const next = { ...deliverySettings, shipping };
    const [updated] = await db
      .update(storesTable)
      .set({ deliverySettings: next })
      .where(eq(storesTable.id, req.user.storeId))
      .returning();
    return res.json({ shipping: (updated.deliverySettings as Record<string, unknown>)?.shipping ?? {} });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update shipping settings";
    return res.status(500).json({ error: msg });
  }
});

export default router;
