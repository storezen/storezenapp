import type { Order } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/order-pipeline";

export type BadgeTone = "yellow" | "green" | "gray" | "red";

function normPaymentMethod(m: string) {
  return (m || "").toLowerCase().replace(/[-_]/g, " ");
}

/** What the store still expects to collect (COD) vs collected / other. */
export function getPaymentStatusDisplay(o: Order): { label: string; tone: BadgeTone } {
  const s = o.order_status;
  if (s === "cancelled") return { label: "Cancelled", tone: "red" };
  if (s === "returned") return { label: "Not collected", tone: "gray" };
  if (s === "delivered") {
    if (normPaymentMethod(o.payment_method).includes("cod") || normPaymentMethod(o.payment_method).includes("cash")) {
      return { label: "Paid", tone: "green" };
    }
    return { label: "Paid", tone: "green" };
  }
  if (normPaymentMethod(o.payment_method).includes("cod") || normPaymentMethod(o.payment_method).includes("cash on delivery")) {
    return { label: "Payment pending", tone: "yellow" };
  }
  return { label: "Payment pending", tone: "yellow" };
}

export function getFulfillmentDisplay(o: Order): { label: string; tone: BadgeTone } {
  const s = o.order_status;
  if (s === "cancelled") return { label: "Cancelled", tone: "red" };
  if (s === "returned") return { label: "Returned", tone: "gray" };
  if (s === "delivered") return { label: "Fulfilled", tone: "gray" };
  if (s === "shipped" || s === "out_for_delivery") return { label: "On the way", tone: "gray" };
  if (s === "new" || s === "confirmed") return { label: "Unfulfilled", tone: "yellow" };
  return { label: ORDER_STATUS_LABELS[s] ?? s, tone: "gray" };
}

export function getDeliveryStatusLabel(o: Order): string {
  return ORDER_STATUS_LABELS[o.order_status] ?? o.order_status;
}

export function getDeliveryMethodLabel(o: Order): string {
  const m = o.payment_method || "";
  const n = normPaymentMethod(m);
  if (n.includes("cod") || n.includes("cash on delivery")) return "Standard delivery (COD)";
  if (n) return m.replace(/[-_]/g, " ");
  return "—";
}

export function getOrderTags(_o: Order): string {
  return "—";
}

export function countItems(o: Order): number {
  return o.items?.reduce((s, i) => s + (i.qty || 0), 0) ?? 0;
}

export type OrderScope =
  | "all"
  | "action"
  | "unfulfilled"
  | "in_transit"
  | "delivered"
  | "issues";

export function orderMatchesScope(o: Order, scope: OrderScope): boolean {
  const s = o.order_status;
  if (scope === "all") return true;
  if (scope === "unfulfilled") return s === "new" || s === "confirmed";
  if (scope === "in_transit") return s === "shipped" || s === "out_for_delivery";
  if (scope === "delivered") return s === "delivered";
  if (scope === "issues") return s === "cancelled" || s === "returned";
  if (scope === "action") {
    return s === "new" || s === "confirmed" || s === "shipped" || s === "out_for_delivery";
  }
  return true;
}

export function orderMatchesTableSearch(o: Order, q: string): boolean {
  if (!q.trim()) return true;
  const t = q.trim().toLowerCase();
  const id = o.id.toLowerCase();
  const name = o.customer_name.toLowerCase();
  const phone = (o.customer_phone || "").toLowerCase();
  const city = (o.customer_city || "").toLowerCase();
  return id.includes(t) || name.includes(t) || phone.includes(t) || city.includes(t);
}
