import { randomUUID } from "node:crypto";
import {
  sendOrderCancelled,
  sendDelivered,
  sendOrderConfirmed,
  sendOrderReceived,
  sendOutForDelivery,
  sendOwnerAlert,
  sendPickedUp,
} from "@storepk/whatsapp";
import { and, desc, eq, inArray } from "drizzle-orm";
import { conversationStateTable, db } from "../db";
import { influencersTable, orderStatusHistoryTable } from "../db/schema";
import { parseVariantsJson, resolveStock, resolveUnitPrice } from "../lib/variants";
import { trackEvent } from "./eventService.js";
import {
  createOrder,
  findOrderById,
  findOrdersByStore,
  findProductsByIds,
  findValidCoupon,
  getOrderStats,
  incrementCouponUsedCount,
  reduceProductOrVariantStock,
  trackOrder as trackOrderRepo,
  updateOrderStatus,
} from "../repositories/orders.repository";
import { findStoreById } from "../repositories/stores.repository";
import { markCartsRecoveredForOrder } from "./abandoned-cart.service";

type OrderItemInput = {
  productId: string;
  quantity: number;
  variantId?: string;
};

type PlaceOrderInput = {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  items: OrderItemInput[];
  paymentMethod?: string;
  couponCode?: string;
  notes?: string;
  refCode?: string;
};

const ORDER_TRANSITIONS: Record<string, string[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

const MAJOR_CITIES = new Set(["faisalabad", "rawalpindi", "multan", "peshawar", "gujranwala", "sialkot", "hyderabad"]);
const PRIME_CITIES = new Set(["karachi", "lahore", "islamabad"]);

function isWhatsappEnabled() {
  const raw = process.env.WHATSAPP_ENABLED;
  if (!raw) return true;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/** Match Ultramsg `from` (digits) to rows saved from `customerPhone`. */
export function normalizePhoneDigits(input: string): string {
  return String(input ?? "").replace(/\D/g, "");
}

function getDeliveryFeeByCity(city: string) {
  const normalized = city.trim().toLowerCase();
  if (PRIME_CITIES.has(normalized)) return 200;
  if (MAJOR_CITIES.has(normalized)) return 250;
  return 350;
}

async function sendOrderWhatsapp(order: { id: string; total: string; customerName: string; customerPhone: string; storeId: string }, status: string) {
  if (!isWhatsappEnabled()) return;
  const store = await findStoreById(order.storeId);
  if (!store?.whatsappInstance || !store?.whatsappApiKey) return;
  const storePayload = {
    id: store.id,
    name: store.name,
    ownerPhone: store.whatsappNumber ?? undefined,
    whatsappInstanceId: store.whatsappInstance ?? undefined,
    whatsappToken: store.whatsappApiKey ?? undefined,
  };
  const orderPayload = {
    id: order.id,
    total: order.total,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    storeId: order.storeId,
  };

  if (status === "received") {
    await sendOrderReceived(orderPayload, storePayload);
    await sendOwnerAlert(orderPayload, storePayload);
    return;
  }
  if (status === "confirmed") {
    await sendOrderConfirmed(orderPayload, storePayload);
    return;
  }
  if (status === "cancelled") {
    await sendOrderCancelled(orderPayload, storePayload);
    return;
  }
  if (status === "shipped") {
    await sendPickedUp(orderPayload, storePayload);
    return;
  }
  if (status === "out_for_delivery") {
    await sendOutForDelivery(orderPayload, storePayload);
    return;
  }
  if (status === "delivered") {
    await sendDelivered(orderPayload, storePayload);
  }
}

export async function placeOrder(data: PlaceOrderInput) {
  if (data.items.length === 0) throw new Error("Order must contain at least one item");

  const products = await findProductsByIds(
    data.storeId,
    data.items.map((i) => i.productId),
  );

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    const available = resolveStock(product, item.variantId);
    if (available < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
  }

  const lineItems = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const { unit, name: variantName } = resolveUnitPrice(product, item.variantId);
    const hasVariants = parseVariantsJson(product.variants).length > 0;
    const lineName = hasVariants && variantName ? `${product.name} (${variantName})` : product.name;
    return {
      productId: product.id,
      name: lineName,
      quantity: item.quantity,
      unitPrice: unit,
      lineTotal: unit * item.quantity,
      variantId: item.variantId,
      variantName: variantName ?? undefined,
    };
  });

  const subtotal = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee = getDeliveryFeeByCity(data.customerCity);

  let discount = 0;
  if (data.couponCode) {
    const coupon = await findValidCoupon(data.storeId, data.couponCode);
    if (coupon) {
      const minOrder = Number(coupon.minOrder ?? 0);
      if (subtotal >= minOrder) {
        if (coupon.type === "percentage") discount = (subtotal * Number(coupon.value)) / 100;
        else if (coupon.type === "fixed") discount = Number(coupon.value);
        discount = Math.max(0, Math.min(discount, subtotal));
        await incrementCouponUsedCount(coupon.id);
      }
    }
  }

  const total = subtotal + deliveryFee - discount;

  let influencerRefCode: string | null = null;
  if (data.refCode) {
    const normalized = data.refCode.trim().toUpperCase();
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(and(eq(influencersTable.storeId, data.storeId), eq(influencersTable.refCode, normalized), eq(influencersTable.isActive, true)))
      .limit(1);
    if (influencer) influencerRefCode = influencer.refCode;
  }

  const order = await createOrder({
    id: randomUUID(),
    storeId: data.storeId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerCity: data.customerCity,
    customerAddress: data.customerAddress,
    items: lineItems,
    subtotal: String(subtotal),
    deliveryFee: String(deliveryFee),
    discount: String(discount),
    total: String(total),
    paymentMethod: data.paymentMethod ?? "cod",
    paymentStatus: "pending",
    orderStatus: "new",
    couponCode: data.couponCode ?? null,
    refCode: influencerRefCode,
    notes: data.notes ?? null,
  });

  for (const item of data.items) {
    await reduceProductOrVariantStock(item.productId, item.quantity, item.variantId);
  }

  try {
    await markCartsRecoveredForOrder(data.storeId, data.customerPhone);
  } catch {
    // non-blocking
  }

  await db.insert(conversationStateTable).values({
    id: randomUUID(),
    phone: normalizePhoneDigits(order.customerPhone) || order.customerPhone.trim(),
    orderId: order.id,
    waitingFor: "order_confirmation",
  });

  // Non-blocking: order placement must not fail if WhatsApp send fails.
  try {
    await sendOrderWhatsapp(
      {
        id: order.id,
        total: String(order.total),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        storeId: order.storeId,
      },
      "received",
    );
  } catch {
    // ignore WhatsApp errors in order creation flow
  }

  // Track purchase event for live analytics (non-blocking)
  try {
    trackEvent({
      storeId: order.storeId,
      sessionId: order.customerPhone,
      eventType: "purchase",
      orderId: order.id,
      amount: Number(order.total),
      timestamp: Date.now(),
    });
  } catch {
    // non-blocking: event tracking should not affect order creation
  }

  return order;
}

export async function updateStatus(id: string, status: string, storeId: string) {
  const order = await findOrderById(id);
  if (!order) throw new Error("NotFound");
  if (order.storeId !== storeId) throw new Error("Forbidden");
  const fromStatus = order.orderStatus ?? "new";
  const allowed = ORDER_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(status) && fromStatus !== status) {
    throw new Error("InvalidStatusTransition");
  }
  const prevStatus = fromStatus;
  const updated = await updateOrderStatus(id, status);
  if (!updated) throw new Error("NotFound");
  await db.insert(orderStatusHistoryTable).values({
    orderId: updated.id,
    storeId: updated.storeId,
    previousStatus: String(prevStatus),
    nextStatus: status,
  });
  try {
    await sendOrderWhatsapp(
      {
        id: updated.id,
        total: String(updated.total),
        customerName: updated.customerName,
        customerPhone: updated.customerPhone,
        storeId: updated.storeId,
      },
      status,
    );
  } catch {
    // ignore WhatsApp errors in status update flow
  }
  if (status === "shipped") {
    await db
      .delete(conversationStateTable)
      .where(eq(conversationStateTable.orderId, updated.id));
  }
  if (status === "delivered" && prevStatus !== "delivered" && updated.refCode) {
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(and(eq(influencersTable.storeId, updated.storeId), eq(influencersTable.refCode, updated.refCode)))
      .limit(1);
    if (influencer) {
      const commission = (Number(updated.total ?? 0) * Number(influencer.commissionPercent ?? 0)) / 100;
      await db
        .update(influencersTable)
        .set({
          totalOrders: Number(influencer.totalOrders ?? 0) + 1,
          totalCommission: String(Number(influencer.totalCommission ?? 0) + commission),
        })
        .where(eq(influencersTable.id, influencer.id));
    }
  }
  return updated;
}

export async function processOrderConfirmationReply(phone: string, body: string) {
  const normalized = body.trim().toLowerCase();
  const phoneKey = normalizePhoneDigits(phone) || phone.trim();
  const phoneVariants = Array.from(new Set([phoneKey, phone.trim()].filter((p) => p.length > 0)));
  if (phoneVariants.length === 0) {
    return { ok: true, handled: false };
  }
  const [state] = await db
    .select()
    .from(conversationStateTable)
    .where(
      and(eq(conversationStateTable.waitingFor, "order_confirmation"), inArray(conversationStateTable.phone, phoneVariants)),
    )
    .orderBy(desc(conversationStateTable.createdAt))
    .limit(1);

  if (!state?.orderId) {
    return { ok: true, handled: false };
  }

  const order = await findOrderById(state.orderId);
  if (!order) {
    await db.delete(conversationStateTable).where(eq(conversationStateTable.id, state.id));
    return { ok: true, handled: false };
  }

  const store = await findStoreById(order.storeId);
  if (!store?.whatsappInstance || !store?.whatsappApiKey) {
    return { ok: false, handled: false };
  }

  const storePayload = {
    id: store.id,
    name: store.name,
    ownerPhone: store.whatsappNumber ?? undefined,
    whatsappInstanceId: store.whatsappInstance ?? undefined,
    whatsappToken: store.whatsappApiKey ?? undefined,
  };
  const orderPayload = {
    id: order.id,
    total: String(order.total),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    storeId: order.storeId,
  };

  if (normalized === "1") {
    await updateOrderStatus(order.id, "confirmed");
    await db.insert(orderStatusHistoryTable).values({
      orderId: order.id,
      storeId: order.storeId,
      previousStatus: String(order.orderStatus ?? "new"),
      nextStatus: "confirmed",
    });
    try {
      await sendOrderConfirmed(orderPayload, storePayload);
    } catch {
      // WhatsApp must not block webhook
    }
    await db.delete(conversationStateTable).where(eq(conversationStateTable.id, state.id));
    return { ok: true, handled: true };
  }
  if (normalized === "2") {
    await updateOrderStatus(order.id, "cancelled");
    await db.insert(orderStatusHistoryTable).values({
      orderId: order.id,
      storeId: order.storeId,
      previousStatus: String(order.orderStatus ?? "new"),
      nextStatus: "cancelled",
    });
    try {
      await sendOrderCancelled(orderPayload, storePayload);
    } catch {
      // WhatsApp must not block webhook
    }
    await db.delete(conversationStateTable).where(eq(conversationStateTable.id, state.id));
    return { ok: true, handled: true };
  }
  return { ok: true, handled: true, invalid: true, orderPayload, storePayload };
}

export async function trackOrder(orderId?: string, phone?: string) {
  if (!orderId && !phone) throw new Error("orderId or phone is required");
  return trackOrderRepo(orderId, phone);
}

export async function exportCSV(storeId: string) {
  const rows = await findOrdersByStore(storeId, { page: 1, pageSize: 10000 });
  const header = [
    "id",
    "customer_name",
    "customer_phone",
    "customer_city",
    "subtotal",
    "delivery_fee",
    "discount",
    "total",
    "payment_method",
    "payment_status",
    "order_status",
    "coupon_code",
    "created_at",
  ].join(",");

  const safe = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const body = rows.map((r) =>
    [
      r.id,
      r.customerName,
      r.customerPhone,
      r.customerCity,
      r.subtotal,
      r.deliveryFee,
      r.discount,
      r.total,
      r.paymentMethod,
      r.paymentStatus,
      r.orderStatus,
      r.couponCode ?? "",
      r.createdAt?.toISOString?.() ?? "",
    ]
      .map(safe)
      .join(","),
  );

  return [header, ...body].join("\n");
}

export async function listStoreOrders(
  storeId: string,
  filters: { status?: string; search?: string; page?: number; pageSize?: number },
) {
  const orders = await findOrdersByStore(storeId, filters);
  const stats = await getOrderStats(storeId);
  return { orders, stats };
}

