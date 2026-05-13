import type { Order } from "@/types";

export function mapOrderFromApi(raw: unknown): Order {
  const row = raw as Record<string, unknown>;
  const created = row.createdAt ?? row.created_at;
  const updated = row.updatedAt ?? row.updated_at;
  return {
    id: String(row.id),
    customer_name: String(row.customerName ?? row.customer_name ?? ""),
    customer_phone: String(row.customerPhone ?? row.customer_phone ?? ""),
    customer_city: String(row.customerCity ?? row.customer_city ?? ""),
    customer_address: String(row.customerAddress ?? row.customer_address ?? ""),
    items: (row.items as Order["items"]) ?? [],
    subtotal: Number(row.subtotal ?? row.total ?? 0),
    delivery_fee: Number(row.deliveryFee ?? row.delivery_fee ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total ?? 0),
    payment_method: String(row.paymentMethod ?? row.payment_method ?? "cod"),
    payment_status: String(row.paymentStatus ?? row.payment_status ?? "pending"),
    order_status: String(row.orderStatus ?? row.order_status ?? "pending"),
    coupon_code: row.couponCode ? String(row.couponCode) : row.coupon_code ? String(row.coupon_code) : null,
    ref_code: row.refCode ? String(row.refCode) : row.ref_code ? String(row.ref_code) : null,
    tracking_number: row.trackingNumber ? String(row.trackingNumber) : row.tracking_number ? String(row.tracking_number) : null,
    courier: row.courier ? String(row.courier) : null,
    notes: row.notes ? String(row.notes) : null,
    created_at: created instanceof Date ? created.toISOString() : String(created ?? ""),
    updated_at: updated instanceof Date ? updated.toISOString() : updated ? String(updated) : undefined,
  };
}

export function mapOrdersFromApi(list: unknown[]): Order[] {
  return list.map(mapOrderFromApi);
}