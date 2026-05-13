import type { Product, ProductVariant } from "@/types";
import { normalizeProductImages } from "@/lib/images";

function mapTags(raw: unknown): string[] | undefined {
  if (raw == null || !Array.isArray(raw)) return undefined;
  const out = raw.map((t) => String(t).trim()).filter(Boolean);
  return out.length ? out : undefined;
}

function mapVariants(raw: unknown): ProductVariant[] | undefined {
  if (raw == null || !Array.isArray(raw)) return undefined;
  const out: ProductVariant[] = [];
  for (const v of raw) {
    if (v && typeof v === "object" && "id" in v && "name" in v) {
      const o = v as Record<string, unknown>;
      out.push({
        id: String(o.id),
        name: String(o.name),
        price: Number(o.price ?? 0),
        stock: Number(o.stock ?? 0),
        image: o.image != null ? String(o.image) : undefined,
      });
    }
  }
  return out.length ? out : undefined;
}

/**
 * API returns Drizzle-style camelCase; UI types use snake_case for legacy fields.
 */
export function mapProductFromApi(raw: unknown): Product {
  const p = raw as Record<string, unknown>;
  const price = p.price;
  const sale = p.salePrice ?? p.sale_price;
  const lowRaw = p.lowStockThreshold ?? p.low_stock_threshold;
  const low =
    lowRaw == null || lowRaw === ""
      ? undefined
      : Number.isFinite(Number(lowRaw))
        ? Number(lowRaw)
        : undefined;
  const tags = mapTags(p.tags);
  const metaT = p.metaTitle ?? p.meta_title;
  const metaD = p.metaDesc ?? p.meta_desc;
  const featured = p.isFeatured ?? p.is_featured;
  const isDraft = p.isDraft ?? p.is_draft;
  const productType = p.productType ?? p.product_type;
  const costRaw = p.costPrice ?? p.cost_price;
  const track = p.trackInventory ?? p.track_inventory;
  return {
    id: String(p.id),
    name: String(p.name),
    slug: String(p.slug),
    price: Number(price),
    sale_price: sale != null && sale !== "" ? Number(sale) : undefined,
    cost_price: costRaw != null && costRaw !== "" ? Number(costRaw) : undefined,
    stock: Number(p.stock ?? 0),
    images: normalizeProductImages(p.images),
    category: String(p.category ?? ""),
    description: String(p.description ?? ""),
    is_active: Boolean(p.isActive ?? p.is_active ?? true),
    ...(typeof isDraft === "boolean" ? { is_draft: isDraft } : {}),
    ...(productType != null && String(productType) !== "" ? { product_type: String(productType) } : {}),
    ...(p.vendor != null && String(p.vendor) !== "" ? { vendor: String(p.vendor) } : {}),
    ...(p.sku != null && String(p.sku) !== "" ? { sku: String(p.sku) } : {}),
    ...(typeof track === "boolean" ? { track_inventory: track } : {}),
    storeId: p.storeId != null ? String(p.storeId) : undefined,
    variants: mapVariants(p.variants),
    ...(tags ? { tags } : {}),
    ...(metaT != null && String(metaT) !== "" ? { meta_title: String(metaT) } : {}),
    ...(metaD != null && String(metaD) !== "" ? { meta_desc: String(metaD) } : {}),
    ...(low !== undefined && Number.isFinite(low) ? { low_stock_threshold: low } : {}),
    ...(typeof featured === "boolean" ? { is_featured: featured } : {}),
    ...(Array.isArray(p.collectionIds)
      ? { collection_ids: p.collectionIds.map((x: unknown) => String(x)) }
      : {}),
    ...(Array.isArray(p.collectionLabels)
      ? { collection_labels: p.collectionLabels.map((x: unknown) => String(x)) }
      : {}),
  };
}

export function mapProductsFromApi(list: unknown[]): Product[] {
  return list.map(mapProductFromApi);
}
