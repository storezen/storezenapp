export interface PostexCredentials {
  apiKey: string;
}

type ShippingOrder = {
  id: string;
  total: number | string;
  customer_phone: string;
  customer_name: string;
  customer_address: string;
  customer_city: string;
};

export async function bookShipment(order: ShippingOrder, creds: PostexCredentials) {
  const today = new Date().toISOString().slice(0, 10);
  const resp = await fetch("https://api.postex.pk/services/integration/api/order/v3/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: creds.apiKey,
    },
    body: JSON.stringify({
      orderRefNumber: order.id,
      orderDate: today,
      invoicePayment: Number(order.total),
      invoiceAmount: Number(order.total),
      mobileNumber: order.customer_phone,
      customerName: order.customer_name,
      customerAddress: order.customer_address,
      districtName: order.customer_city,
      weight: "0.5",
    }),
  });
  if (!resp.ok) throw new Error("PostEx booking failed");
  const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    tracking_number: String(data.trackingNumber ?? data.consignmentNumber ?? ""),
    booking_id: String(data.bookingId ?? data.orderRefNumber ?? order.id),
  };
}

export async function trackShipment(trackingNumber: string, creds: PostexCredentials) {
  const url = `https://api.postex.pk/services/integration/api/order/v1/track-order/${encodeURIComponent(trackingNumber)}`;
  const resp = await fetch(url, {
    headers: { token: creds.apiKey },
  });
  if (!resp.ok) throw new Error("PostEx track failed");
  const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    status: mapStatus(String(data.status ?? data.statusCode ?? "unknown")),
    location: String(data.location ?? data.cityName ?? ""),
    timestamp: String(data.timestamp ?? data.updatedAt ?? new Date().toISOString()),
  };
}

export function mapStatus(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("book") || value.includes("pickup")) return "booked";
  if (value.includes("transit") || value.includes("dispatch")) return "in_transit";
  if (value.includes("out for delivery")) return "out_for_delivery";
  if (value.includes("deliver")) return "delivered";
  if (value.includes("return") || value.includes("cancel") || value.includes("undeliver")) return "failed";
  return "booked";
}
