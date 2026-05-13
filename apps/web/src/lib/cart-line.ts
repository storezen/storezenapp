import type { CartItem } from "@/types";

export function cartLineKey(productId: string, variantId?: string) {
  return `${productId}::${variantId ?? "default"}`;
}

export function withLineKey(item: Omit<CartItem, "lineKey">): CartItem {
  return {
    ...item,
    lineKey: cartLineKey(item.product_id, item.variantId),
  };
}

export function migrateLegacyCartItem(raw: Record<string, unknown>): CartItem {
  const product_id = String(raw.product_id ?? "");
  const variantId = raw.variantId != null ? String(raw.variantId) : undefined;
  const lineKey =
    typeof raw.lineKey === "string" ? raw.lineKey : cartLineKey(product_id, variantId);
  return {
    lineKey,
    product_id,
    name: String(raw.name ?? ""),
    price: Number(raw.price ?? 0),
    qty: Number(raw.qty ?? 1),
    image: String(raw.image ?? ""),
    variantId,
    variantName: raw.variantName != null ? String(raw.variantName) : undefined,
  };
}
