import { STORE_NAME } from "@/lib/constants";

export function buildWhatsAppOrderMessage(input: {
  productName: string;
  qty: number;
  total: number;
  city?: string;
}) {
  const lines = [
    "Assalam o Alaikum!",
    `I want to place an order.`,
    `Product: ${input.productName}`,
    `Quantity: ${input.qty}`,
    `Total: Rs. ${Math.round(input.total).toLocaleString()}`,
    input.city ? `City: ${input.city}` : null,
    `Store: ${STORE_NAME ?? "Store"}`,
    "Please confirm COD and delivery timeline.",
  ].filter(Boolean);

  return encodeURIComponent(lines.join("\n"));
}
