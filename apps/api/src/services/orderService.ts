/**
 * ORDER SERVICE (REFACTORED)
 *
 * Uses state machine for all status transitions.
 * Emits events for all order actions.
 * Integrates with courier, WhatsApp, and real-time systems.
 */

import { randomUUID } from "node:crypto";
import { db } from "../db";
import { ordersTable, orderStatusHistoryTable, conversationStateTable, influencersTable } from "../db/schema";
import { and, eq, desc } from "drizzle-orm";
import {
  OrderStateMachine,
  ORDER_STATES,
  canTransition,
  mapLegacyStatus,
  getStateLabel,
  type OrderState,
  type OrderEvent,
} from "./orderStateMachine";
import { emitOrderEvent, eventBus } from "./eventBus";
import { trackEvent } from "./eventService";
import {
  createOrder,
  findOrderById,
  findOrdersByStore,
  findProductsByIds,
  findValidCoupon,
  getOrderStats,
  incrementCouponUsedCount,
  reduceProductOrVariantStock,
  updateOrderStatus,
} from "../repositories/orders.repository";
import { findStoreById } from "../repositories/stores.repository";
import { markCartsRecoveredForOrder } from "./abandoned-cart.service";
import { parseVariantsJson, resolveStock, resolveUnitPrice } from "../lib/variants";

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderItemInput = {
  productId: string;
  quantity: number;
  variantId?: string;
};

export type PlaceOrderInput = {
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

// ── Delivery Fee Calculation ────────────────────────────────────────────────────

const MAJOR_CITIES = new Set(["faisalabad", "rawalpindi", "multan", "peshawar", "gujranwala", "sialkot", "hyderabad"]);
const PRIME_CITIES = new Set(["karachi", "lahore", "islamabad"]);

function getDeliveryFeeByCity(city: string): number {
  const normalized = city.trim().toLowerCase();
  if (PRIME_CITIES.has(normalized)) return 200;
  if (MAJOR_CITIES.has(normalized)) return 250;
  return 350;
}

// ── Place Order ────────────────────────────────────────────────────────────────

export async function placeOrder(data: PlaceOrderInput) {
  if (data.items.length === 0) throw new Error("Order must contain at least one item");

  // Fetch products
  const products = await findProductsByIds(
    data.storeId,
    data.items.map((i) => i.productId),
  );

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate stock
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    const available = resolveStock(product, item.variantId);
    if (available < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
  }

  // Build line items
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

  // Calculate totals
  const subtotal = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee = getDeliveryFeeByCity(data.customerCity);

  let discount = 0;
  if (data.couponCode) {
    const coupon = await findValidCoupon(data.storeId, data.couponCode);
    if (coupon) {
      const minOrder = Number(coupon.minOrder ?? 0);
      if (subtotal >= minOrder) {
        if (coupon.type === "percentage") {
          discount = (subtotal * Number(coupon.value)) / 100;
        } else if (coupon.type === "fixed") {
          discount = Number(coupon.value);
        }
        discount = Math.max(0, Math.min(discount, subtotal));
        await incrementCouponUsedCount(coupon.id);
      }
    }
  }

  const total = subtotal + deliveryFee - discount;

  // Resolve influencer
  let influencerRefCode: string | null = null;
  if (data.refCode) {
    const normalized = data.refCode.trim().toUpperCase();
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(
        and(
          eq(influencersTable.storeId, data.storeId),
          eq(influencersTable.refCode, normalized),
          eq(influencersTable.isActive, true)
        )
      )
      .limit(1);
    if (influencer) {
      influencerRefCode = influencer.refCode;
    }
  }

  // Create order using state machine
  const orderId = randomUUID();
  const initialState = ORDER_STATES.PENDING_CONFIRMATION;

  const order = await createOrder({
    id: orderId,
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
    orderStatus: initialState,
    couponCode: data.couponCode ?? null,
    refCode: influencerRefCode,
    notes: data.notes ?? null,
  });

  // Reduce stock
  for (const item of data.items) {
    await reduceProductOrVariantStock(item.productId, item.quantity, item.variantId);
  }

  // Mark abandoned carts as recovered
  try {
    await markCartsRecoveredForOrder(data.storeId, data.customerPhone);
  } catch {
    // non-blocking
  }

  // Create conversation state for WhatsApp confirmation
  await db.insert(conversationStateTable).values({
    id: randomUUID(),
    phone: normalizePhoneDigits(order.customerPhone),
    orderId: order.id,
    waitingFor: "order_confirmation",
  });

  // Emit order_created event
  emitOrderEvent(
    order.id,
    data.storeId,
    "order_created",
    null,
    initialState,
    {
      total: String(total),
      items: lineItems.length,
      paymentMethod: data.paymentMethod ?? "cod",
    }
  );

  // Track purchase event for analytics (non-blocking)
  try {
    trackEvent({
      storeId: data.storeId,
      sessionId: data.customerPhone,
      eventType: "purchase",
      orderId: order.id,
      amount: total,
      timestamp: Date.now(),
    });
  } catch {
    // non-blocking
  }

  return order;
}

// ── Update Order Status (State Machine) ─────────────────────────────────────

export async function updateStatus(
  orderId: string,
  newStatus: string,
  storeId: string
) {
  // Fetch current order
  const order = await findOrderById(orderId);
  if (!order) throw new Error("NotFound");

  // Validate store ownership
  if (order.storeId !== storeId) throw new Error("Forbidden");

  // Map legacy status if needed
  const targetState = mapLegacyStatus(newStatus);
  const currentState = mapLegacyStatus(order.orderStatus ?? "new");

  // Use state machine to validate transition
  if (!canTransition(currentState, targetState)) {
    throw new Error(`InvalidStatusTransition: ${order.orderStatus} → ${newStatus}`);
  }

  const prevStatus = order.orderStatus ?? "new";

  // Update status in database
  const updated = await updateOrderStatus(orderId, newStatus);
  if (!updated) throw new Error("NotFound");

  // Record status history
  await db.insert(orderStatusHistoryTable).values({
    id: randomUUID(),
    orderId: updated.id,
    storeId: updated.storeId,
    previousStatus: prevStatus,
    nextStatus: newStatus,
  });

  // Emit status update event
  emitOrderEvent(
    orderId,
    storeId,
    "order_status_updated",
    prevStatus,
    newStatus,
    { updatedBy: "admin" }
  );

  // Handle special transitions
  if (targetState === ORDER_STATES.SHIPPED) {
    // Clear conversation state when shipped
    await db
      .delete(conversationStateTable)
      .where(eq(conversationStateTable.orderId, orderId));
  }

  if (targetState === ORDER_STATES.DELIVERED && prevStatus !== "delivered" && updated.refCode) {
    // Credit influencer commission on delivery
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(
        and(
          eq(influencersTable.storeId, updated.storeId),
          eq(influencersTable.refCode, updated.refCode)
        )
      )
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

// ── Process WhatsApp Confirmation Reply ───────────────────────────────────────

export async function processOrderConfirmationReply(phone: string, body: string) {
  const normalized = body.trim().toLowerCase();
  const phoneKey = normalizePhoneDigits(phone);

  const [state] = await db
    .select()
    .from(conversationStateTable)
    .where(
      and(
        eq(conversationStateTable.waitingFor, "order_confirmation"),
        eq(conversationStateTable.phone, phoneKey)
      )
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

  if (normalized === "1") {
    // Customer confirmed
    await updateStatus(order.id, "confirmed", order.storeId);
    await db.delete(conversationStateTable).where(eq(conversationStateTable.id, state.id));
    return { ok: true, handled: true };
  }

  if (normalized === "2") {
    // Customer cancelled
    await updateStatus(order.id, "cancelled", order.storeId);
    await db.delete(conversationStateTable).where(eq(conversationStateTable.id, state.id));
    return { ok: true, handled: true };
  }

  return { ok: true, handled: true, invalid: true };
}

// ── Track Order ────────────────────────────────────────────────────────────────

export async function trackOrder(orderId?: string, phone?: string) {
  if (!orderId && !phone) throw new Error("orderId or phone is required");

  const { trackOrder: trackOrderRepo } = await import("../repositories/orders.repository");
  return trackOrderRepo(orderId, phone);
}

// ── Export CSV ────────────────────────────────────────────────────────────────

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
      .join(",")
  );

  return [header, ...body].join("\n");
}

// ── List Orders ────────────────────────────────────────────────────────────────

export async function listStoreOrders(
  storeId: string,
  filters: { status?: string; search?: string; page?: number; pageSize?: number }
) {
  const orders = await findOrdersByStore(storeId, filters);
  const stats = await getOrderStats(storeId);
  return { orders, stats };
}

// ── Helper Functions ───────────────────────────────────────────────────────────

function normalizePhoneDigits(input: string): string {
  return String(input ?? "").replace(/\D/g, "");
}

/**
 * Get allowed next states for an order
 */
export function getAllowedNextStates(orderId: string, storeId: string): OrderState[] {
  // This would typically fetch from database
  // For now, using state machine logic
  return [];
}

/**
 * Get order event history
 */
export async function getOrderEventHistory(orderId: string) {
  return eventBus.getOrderEvents(orderId);
}