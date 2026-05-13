/**
 * WHATSAPP AUTOMATION SERVICE
 *
 * Event-driven WhatsApp notifications for order lifecycle.
 * Consumes order events and sends appropriate messages.
 *
 * Templates:
 * - order_created: Order received confirmation
 * - order_confirmed: Order confirmed message
 * - order_shipped: Tracking info with link
 * - order_delivered: Delivery confirmation + feedback
 * - order_cancelled: Cancellation notice
 */

import { eventBus, type EventPayload, type EventType } from "./eventBus";
import { db } from "../db";
import { storesTable, ordersTable, whatsappLogsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// Message templates with placeholders
interface MessageTemplate {
  template: string;
  variables: string[];
}

const TEMPLATES: Record<string, MessageTemplate> = {
  order_received: {
    template: `Assalam o Alaikum {{customerName}}!

Your order #{{orderId}} has been received.

Order Details:
- Total: Rs.{{total}}
- Payment: {{paymentMethod}}

We will confirm your order shortly.

Thank you for shopping with us!`,
    variables: ["customerName", "orderId", "total", "paymentMethod"],
  },
  order_confirmed: {
    template: `Assalam o Alaikum {{customerName}}!

Great news! Your order #{{orderId}} has been confirmed.

We're preparing your items and will ship soon.

Thank you for shopping with us!`,
    variables: ["customerName", "orderId"],
  },
  order_shipped: {
    template: `Assalam o Alaikum {{customerName}}!

Your order #{{orderId}} has been shipped!

📦 Tracking: {{trackingNumber}}
🚚 Courier: {{courier}}

Track your order: {{trackingLink}}

Thank you for shopping with us!`,
    variables: ["customerName", "orderId", "trackingNumber", "courier", "trackingLink"],
  },
  order_out_for_delivery: {
    template: `Assalam o Alaikum {{customerName}}!

Your order #{{orderId}} is out for delivery! 📦

Please ensure someone is available to receive your package.

Thank you!`,
    variables: ["customerName", "orderId"],
  },
  order_delivered: {
    template: `Assalam o Alaikum {{customerName}}!

Your order #{{orderId}} has been delivered! ✅

We hope you love your purchase!

Please share your feedback - it helps us serve you better.

Thank you for shopping with us! 🙏`,
    variables: ["customerName", "orderId"],
  },
  order_cancelled: {
    template: `Assalam o Alaikum {{customerName}}!

Your order #{{orderId}} has been cancelled.

If you have any questions, please contact us.

Thank you.`,
    variables: ["customerName", "orderId"],
  },
};

/**
 * Replace template placeholders with actual values
 */
function parseTemplate(templateId: string, data: Record<string, string>): string {
  const template = TEMPLATES[templateId];
  if (!template) return "";

  let message = template.template;
  for (const variable of template.variables) {
    const value = data[variable] || "";
    message = message.replace(new RegExp(`{{${variable}}}`, "g"), value);
  }
  return message;
}

/**
 * Check if WhatsApp is enabled for store
 */
async function isWhatsappEnabled(storeId: string): Promise<boolean> {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, storeId))
    .limit(1);

  if (!store) return false;

  // Check if WhatsApp is configured
  if (!store.whatsappInstance || !store.whatsappApiKey) {
    return false;
  }

  return true;
}

/**
 * Get WhatsApp configuration for store
 */
async function getWhatsappConfig(storeId: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, storeId))
    .limit(1);

  return store
    ? {
        instanceId: store.whatsappInstance,
        apiKey: store.whatsappApiKey,
        whatsappNumber: store.whatsappNumber,
      }
    : null;
}

/**
 * Send WhatsApp message (via Ultramsg or other provider)
 */
async function sendWhatsappMessage(
  storeId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const config = await getWhatsappConfig(storeId);
  if (!config) {
    return { success: false, error: "WhatsApp not configured" };
  }

  // Normalize phone number
  const normalizedPhone = phone.replace(/\D/g, "");

  try {
    // Log the message
    await db.insert(whatsappLogsTable).values({
      id: randomUUID(),
      storeId,
      phone: normalizedPhone,
      message,
      status: "pending",
    });

    // Send via Ultramsg API
    const response = await fetch(
      `https://api.ultramsg.com/${config.instanceId}/messages/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: config.apiKey,
          to: normalizedPhone,
          body: message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Update log status
    // (In production, you'd update the log with message ID from response)

    return { success: true };
  } catch (error) {
    console.error("[WhatsAppService] Send error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get order data for message templates
 */
async function getOrderData(orderId: string, storeId: string) {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  return order || null;
}

/**
 * Build tracking link based on courier
 */
function buildTrackingLink(courier: string, trackingNumber: string): string {
  const trackingLinks: Record<string, string> = {
    postex: `https://www.postex.pk/track/${trackingNumber}`,
    tcx: `https://tcx.com.pk/track/${trackingNumber}`,
    mp: `https://www.muphone.com/track/${trackingNumber}`,
    leopards: `https://www.leopardscod.com/tracking.php?track=${trackingNumber}`,
    // Add more couriers as needed
  };

  return trackingLinks[courier.toLowerCase()] || `https://track.orders.pk/${trackingNumber}`;
}

/**
 * Event handlers for order lifecycle
 */
async function handleOrderCreated(event: EventPayload): Promise<void> {
  const order = await getOrderData(event.orderId, event.storeId);
  if (!order) return;

  const message = parseTemplate("order_received", {
    customerName: order.customerName,
    orderId: order.id.slice(-6),
    total: Number(order.total).toLocaleString(),
    paymentMethod: order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid",
  });

  await sendWhatsappMessage(event.storeId, order.customerPhone, message);
}

async function handleOrderConfirmed(event: EventPayload): Promise<void> {
  const order = await getOrderData(event.orderId, event.storeId);
  if (!order) return;

  const message = parseTemplate("order_confirmed", {
    customerName: order.customerName,
    orderId: order.id.slice(-6),
  });

  await sendWhatsappMessage(event.storeId, order.customerPhone, message);
}

async function handleOrderShipped(event: EventPayload): Promise<void> {
  const order = await getOrderData(event.orderId, event.storeId);
  if (!order || !order.trackingNumber) return;

  const trackingLink = buildTrackingLink(order.courier || "generic", order.trackingNumber);

  const message = parseTemplate("order_shipped", {
    customerName: order.customerName,
    orderId: order.id.slice(-6),
    trackingNumber: order.trackingNumber,
    courier: order.courier || "Our Courier",
    trackingLink,
  });

  await sendWhatsappMessage(event.storeId, order.customerPhone, message);
}

async function handleOrderDelivered(event: EventPayload): Promise<void> {
  const order = await getOrderData(event.orderId, event.storeId);
  if (!order) return;

  const message = parseTemplate("order_delivered", {
    customerName: order.customerName,
    orderId: order.id.slice(-6),
  });

  await sendWhatsappMessage(event.storeId, order.customerPhone, message);
}

async function handleOrderCancelled(event: EventPayload): Promise<void> {
  const order = await getOrderData(event.orderId, event.storeId);
  if (!order) return;

  const message = parseTemplate("order_cancelled", {
    customerName: order.customerName,
    orderId: order.id.slice(-6),
  });

  await sendWhatsappMessage(event.storeId, order.customerPhone, message);
}

/**
 * Initialize WhatsApp automation - register event handlers
 */
export function initializeWhatsAppAutomation(): void {
  // Register handlers for each event type
  eventBus.on("order_created", async (event) => {
    const enabled = await isWhatsappEnabled(event.storeId);
    if (enabled) {
      await handleOrderCreated(event);
    }
  });

  eventBus.on("order_confirmed", async (event) => {
    const enabled = await isWhatsappEnabled(event.storeId);
    if (enabled) {
      await handleOrderConfirmed(event);
    }
  });

  eventBus.on("order_shipped", async (event) => {
    const enabled = await isWhatsappEnabled(event.storeId);
    if (enabled) {
      await handleOrderShipped(event);
    }
  });

  eventBus.on("order_delivered", async (event) => {
    const enabled = await isWhatsappEnabled(event.storeId);
    if (enabled) {
      await handleOrderDelivered(event);
    }
  });

  eventBus.on("order_cancelled", async (event) => {
    const enabled = await isWhatsappEnabled(event.storeId);
    if (enabled) {
      await handleOrderCancelled(event);
    }
  });

  console.log("[WhatsAppAutomation] Initialized - listening for order events");
}

/**
 * Manual send for ad-hoc messages
 */
export async function sendCustomMessage(
  storeId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return sendWhatsappMessage(storeId, phone, message);
}

/**
 * Get WhatsApp logs for a store
 */
export async function getWhatsappLogs(storeId: string, limit = 50) {
  const logs = await db
    .select()
    .from(whatsappLogsTable)
    .where(eq(whatsappLogsTable.storeId, storeId))
    .limit(limit);

  return logs;
}