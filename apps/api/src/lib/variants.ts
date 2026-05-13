import { productsTable } from "../db/schema";

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
};

type ProductRow = typeof productsTable.$inferSelect;

export function parseVariantsJson(raw: unknown): ProductVariant[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as ProductVariant[];
  if (typeof raw === "object" && raw !== null && "list" in raw && Array.isArray((raw as { list: unknown }).list)) {
    return (raw as { list: ProductVariant[] }).list;
  }
  return [];
}

export function resolveUnitPrice(product: ProductRow, variantId?: string | null) {
  const base = Number(product.salePrice ?? product.price);
  if (!variantId) return { unit: base, name: undefined as string | undefined };
  const v = parseVariantsJson(product.variants).find((x) => x.id === variantId);
  if (!v) return { unit: base, name: undefined };
  return { unit: v.price, name: v.name };
}

export function resolveStock(product: ProductRow, variantId?: string | null) {
  const list = parseVariantsJson(product.variants);
  if (list.length > 0 && variantId) {
    const v = list.find((x) => x.id === variantId);
    return v?.stock ?? 0;
  }
  return product.stock ?? 0;
}
