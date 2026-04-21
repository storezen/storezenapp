import { getDb } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sendMessage } from "../providers/ultramsg";
import { MESSAGES, type MessageKey } from "../templates/messages";

type OrderLike = {
  id: string;
  total?: string | number;
  customerName?: string;
  customerPhone?: string;
  storeId?: string;
};

type StoreLike = {
  id: string;
  name?: string;
  ownerPhone?: string;
  whatsappInstanceId?: string;
  whatsappToken?: string;
};

function buildVars(order: OrderLike, store: StoreLike) {
  return {
    id: order.id,
    total: Number(order.total ?? 0),
    name: order.customerName ?? "Customer",
    phone: order.customerPhone ?? "",
    store_name: store.name ?? "Store",
    date: new Date().toISOString().slice(0, 10),
  };
}

async function logWhatsapp(
  order: OrderLike,
  store: StoreLike,
  templateKey: MessageKey,
  phone: string,
  message: string,
  success: boolean,
) {
  try {
    const db = getDb();
    await db.execute(
      sql`
        insert into whatsapp_logs
          (order_id, store_id, phone, template_key, message, provider, success, created_at)
        values
          (${order.id}, ${store.id}, ${phone}, ${templateKey}, ${message}, ${"ultramsg"}, ${success}, now())
      `,
    );
  } catch {
    // Do not block messaging flow if logs table is missing/misaligned.
  }
}

async function runTemplateSend(
  templateKey: MessageKey,
  order: OrderLike,
  store: StoreLike,
  targetPhone: string,
) {
  const message = MESSAGES[templateKey](buildVars(order, store));
  const ok = await sendMessage(
    targetPhone,
    message,
    store.whatsappInstanceId ?? "",
    store.whatsappToken ?? "",
  );
  await logWhatsapp(order, store, templateKey, targetPhone, message, ok);
  return ok;
}

export async function sendOrderReceived(order: OrderLike, store: StoreLike) {
  return runTemplateSend("ORDER_RECEIVED", order, store, order.customerPhone ?? "");
}

export async function sendOrderConfirmed(order: OrderLike, store: StoreLike) {
  return runTemplateSend("ORDER_CONFIRMED", order, store, order.customerPhone ?? "");
}

export async function sendOrderCancelled(order: OrderLike, store: StoreLike) {
  return runTemplateSend("ORDER_CANCELLED", order, store, order.customerPhone ?? "");
}

export async function sendPickedUp(order: OrderLike, store: StoreLike) {
  return runTemplateSend("PICKED_UP", order, store, order.customerPhone ?? "");
}

export async function sendOutForDelivery(order: OrderLike, store: StoreLike) {
  return runTemplateSend("OUT_FOR_DELIVERY", order, store, order.customerPhone ?? "");
}

export async function sendDelivered(order: OrderLike, store: StoreLike) {
  return runTemplateSend("DELIVERED", order, store, order.customerPhone ?? "");
}

export async function sendOwnerAlert(order: OrderLike, store: StoreLike) {
  return runTemplateSend("NEW_ORDER_ALERT", order, store, store.ownerPhone ?? "");
}

export async function sendDailyReport(
  report: { date: string; orders: number; delivered: number; revenue: number },
  store: StoreLike,
) {
  const pseudoOrder: OrderLike = { id: `daily-${report.date}`, total: report.revenue, storeId: store.id };
  const message = MESSAGES.DAILY_REPORT({
    date: report.date,
    orders: report.orders,
    delivered: report.delivered,
    revenue: report.revenue,
  });
  const ok = await sendMessage(
    store.ownerPhone ?? "",
    message,
    store.whatsappInstanceId ?? "",
    store.whatsappToken ?? "",
  );
  await logWhatsapp(pseudoOrder, store, "DAILY_REPORT", store.ownerPhone ?? "", message, ok);
  return ok;
}
