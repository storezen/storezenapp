export interface LeopardsCredentials {
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

export async function bookShipment(order: ShippingOrder, creds: LeopardsCredentials) {
  const resp = await fetch("https://merchantapi.leopardscourier.com/api/bookPacket/format/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: creds.apiKey,
      booked_packet_reference: order.id,
      cod_amount: Number(order.total),
      consignee_name: order.customer_name,
      consignee_phone: order.customer_phone,
      consignee_address: order.customer_address,
      destination_city_name: order.customer_city,
      weight: "0.5",
    }),
  });
  if (!resp.ok) throw new Error("Leopards booking failed");
  const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  const packetList = Array.isArray(data.packet_list) ? (data.packet_list as Record<string, unknown>[]) : [];
  const firstPacket = packetList[0] ?? {};
  return {
    tracking_number: String(data.track_number ?? firstPacket.track_number ?? ""),
    booking_id: String(data.booked_packet_no ?? firstPacket.booked_packet_no ?? order.id),
  };
}

export async function trackShipment(trackingNumber: string, creds: LeopardsCredentials) {
  const resp = await fetch("https://merchantapi.leopardscourier.com/api/trackBookedPacket/format/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: creds.apiKey,
      track_numbers: trackingNumber,
    }),
  });
  if (!resp.ok) throw new Error("Leopards track failed");
  const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  const item = (Array.isArray(data.packet_list) ? data.packet_list[0] : null) as Record<string, unknown> | null;
  return {
    status: mapStatus(String(item?.booked_packet_status ?? data.status ?? "unknown")),
    location: String(item?.destination_city_name ?? item?.consignee_city ?? ""),
    timestamp: String(item?.last_status_datetime ?? new Date().toISOString()),
  };
}

export function mapStatus(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("book") || value.includes("pick")) return "booked";
  if (value.includes("transit") || value.includes("dispatch")) return "in_transit";
  if (value.includes("out for delivery")) return "out_for_delivery";
  if (value.includes("deliver")) return "delivered";
  if (value.includes("return") || value.includes("cancel") || value.includes("undeliver")) return "failed";
  return "booked";
}
