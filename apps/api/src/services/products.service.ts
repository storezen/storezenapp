import { randomUUID } from "node:crypto";
import {
  createProduct,
  deleteProduct,
  findPublicProductBySlug,
  findProductById,
  listPublicProducts,
  listStoreProducts,
  updateProduct,
} from "../repositories/products.repository";
import { parseCsvProducts } from "../lib/csv-parser";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ensureOwnership(storeId: string | null | undefined, resourceStoreId: string) {
  if (!storeId || storeId !== resourceStoreId) throw new Error("Forbidden");
}

export async function getPublicProducts(params: {
  storeSlug: string;
  category?: string;
  q?: string;
  sort?: string;
}) {
  if (!params.storeSlug) throw new Error("store_slug is required");
  return listPublicProducts(params);
}

export async function getStoreProducts(params: {
  storeId: string;
  category?: string;
  q?: string;
  status?: "active" | "inactive";
}) {
  return listStoreProducts(params);
}

export async function getPublicProductBySlug(params: { storeSlug: string; slug: string }) {
  if (!params.storeSlug) throw new Error("store_slug is required");
  if (!params.slug) throw new Error("slug is required");
  return findPublicProductBySlug(params.storeSlug, params.slug);
}

export async function createStoreProduct(
  storeId: string,
  data: {
    name: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    costPrice?: number | null;
    stock?: number;
    lowStockThreshold?: number;
    images?: unknown[];
    variants?: Record<string, unknown>;
    urduDescription?: string | null;
    tiktokCaption?: string | null;
    whatsappText?: string | null;
    metaTitle?: string | null;
    metaDesc?: string | null;
    category?: string | null;
    tags?: unknown[];
    isActive?: boolean;
    isFeatured?: boolean;
  },
) {
  const slug = slugify(data.name);
  return createProduct({
    id: randomUUID(),
    storeId,
    name: data.name,
    slug,
    description: data.description ?? null,
    price: String(data.price),
    salePrice: data.salePrice != null ? String(data.salePrice) : null,
    costPrice: data.costPrice != null ? String(data.costPrice) : null,
    stock: data.stock ?? 0,
    lowStockThreshold: data.lowStockThreshold ?? 5,
    images: data.images ?? [],
    variants: data.variants ?? {},
    urduDescription: data.urduDescription ?? null,
    tiktokCaption: data.tiktokCaption ?? null,
    whatsappText: data.whatsappText ?? null,
    metaTitle: data.metaTitle ?? null,
    metaDesc: data.metaDesc ?? null,
    category: data.category ?? null,
    tags: data.tags ?? [],
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
  });
}

export async function updateStoreProduct(
  storeId: string,
  productId: string,
  data: Partial<{
    name: string;
    description: string | null;
    price: number;
    salePrice: number | null;
    costPrice: number | null;
    stock: number;
    lowStockThreshold: number;
    images: unknown[];
    variants: Record<string, unknown>;
    urduDescription: string | null;
    tiktokCaption: string | null;
    whatsappText: string | null;
    metaTitle: string | null;
    metaDesc: string | null;
    category: string | null;
    tags: unknown[];
    isActive: boolean;
    isFeatured: boolean;
  }>,
) {
  const current = await findProductById(productId);
  if (!current) throw new Error("NotFound");
  ensureOwnership(storeId, current.storeId);

  const patch: Record<string, unknown> = { ...data };
  if (data.name) patch.slug = slugify(data.name);
  if (data.price !== undefined) patch.price = String(data.price);
  if (data.salePrice !== undefined) patch.salePrice = data.salePrice != null ? String(data.salePrice) : null;
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice != null ? String(data.costPrice) : null;

  const updated = await updateProduct(productId, patch);
  if (!updated) throw new Error("NotFound");
  return updated;
}

export async function deleteStoreProduct(storeId: string, productId: string) {
  const current = await findProductById(productId);
  if (!current) throw new Error("NotFound");
  ensureOwnership(storeId, current.storeId);

  const deleted = await deleteProduct(productId);
  if (!deleted) throw new Error("NotFound");
  return deleted;
}

export async function toggleStoreProduct(storeId: string, productId: string) {
  const current = await findProductById(productId);
  if (!current) throw new Error("NotFound");
  ensureOwnership(storeId, current.storeId);

  const updated = await updateProduct(productId, { isActive: !current.isActive });
  if (!updated) throw new Error("NotFound");
  return updated;
}

function toCsvCell(input: unknown) {
  const raw = String(input ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function exportStoreProductsCsv(storeId: string) {
  const products = await listStoreProducts({ storeId });
  const header = [
    "id",
    "name",
    "slug",
    "description",
    "price",
    "sale_price",
    "cost_price",
    "stock",
    "category",
    "meta_title",
    "meta_desc",
    "urdu_description",
    "tiktok_caption",
    "whatsapp_text",
    "is_active",
    "is_featured",
    "created_at",
  ].join(",");

  const rows = products.map((p) =>
    [
      p.id,
      p.name,
      p.slug,
      p.description ?? "",
      p.price,
      p.salePrice ?? "",
      p.costPrice ?? "",
      p.stock,
      p.category ?? "",
      p.metaTitle ?? "",
      p.metaDesc ?? "",
      p.urduDescription ?? "",
      p.tiktokCaption ?? "",
      p.whatsappText ?? "",
      p.isActive,
      p.isFeatured,
      p.createdAt?.toISOString?.() ?? "",
    ]
      .map(toCsvCell)
      .join(","),
  );

  return [header, ...rows].join("\n");
}

export async function importStoreProductsCsv(
  storeId: string,
  csv: string,
  replaceExisting = false,
) {
  const parsed = parseCsvProducts(csv);
  if (parsed.products.length === 0) {
    throw new Error(parsed.errors[0] ?? "No valid products found in CSV");
  }

  let imported = 0;
  let updated = 0;
  const existingProducts = await listStoreProducts({ storeId });
  const existingBySlug = new Map(existingProducts.map((row) => [row.slug, row]));

  for (const p of parsed.products) {
    const existing = existingBySlug.get(p.slug ?? slugify(p.name));

    const payload: Partial<typeof existing> & Record<string, unknown> = {
      name: p.name,
      slug: p.slug ?? slugify(p.name),
      description: p.description ?? null,
      price: String(p.price),
      salePrice: p.compareAtPrice != null ? String(p.compareAtPrice) : null,
      stock: p.stock,
      category: p.category ?? null,
      images: p.images ?? [],
      tags: p.tags ?? [],
      metaTitle: p.metaTitle ?? null,
      metaDesc: p.metaDescription ?? null,
      urduDescription: p.urduDescription ?? null,
      tiktokCaption: p.tiktokCaption ?? null,
      whatsappText: p.whatsappText ?? null,
      isActive: p.active,
    };

    if (existing && replaceExisting) {
      await updateProduct(existing.id, payload);
      updated += 1;
      continue;
    }

    if (!existing) {
      await createProduct({
        id: randomUUID(),
        storeId,
        name: String(payload.name),
        slug: String(payload.slug),
        description: (payload.description as string | null) ?? null,
        price: String(payload.price),
        salePrice: (payload.salePrice as string | null) ?? null,
        costPrice: null,
        stock: Number(payload.stock ?? 0),
        lowStockThreshold: 5,
        images: (payload.images as unknown[]) ?? [],
        variants: {},
        metaTitle: (payload.metaTitle as string | null) ?? null,
        metaDesc: (payload.metaDesc as string | null) ?? null,
        urduDescription: (payload.urduDescription as string | null) ?? null,
        tiktokCaption: (payload.tiktokCaption as string | null) ?? null,
        whatsappText: (payload.whatsappText as string | null) ?? null,
        category: (payload.category as string | null) ?? null,
        tags: (payload.tags as unknown[]) ?? [],
        isActive: Boolean(payload.isActive ?? true),
        isFeatured: false,
      });
      imported += 1;
    }
  }

  return { imported, updated, errors: parsed.errors };
}

export function getProductsCsvTemplate() {
  const header = [
    "name",
    "slug",
    "description",
    "price",
    "compare_at_price",
    "stock",
    "category",
    "image",
    "tags",
    "meta_title",
    "meta_desc",
    "urdu_description",
    "tiktok_caption",
    "whatsapp_text",
    "active",
  ].join(",");

  const sampleRow = [
    "Premium Cotton T-Shirt",
    "premium-cotton-tshirt",
    "Soft breathable cotton t-shirt for daily wear",
    "2499",
    "2999",
    "50",
    "Clothing",
    "https://cdn.example.com/images/premium-cotton-tshirt.jpg",
    "cotton,summer,men",
    "Premium Cotton T-Shirt | Smartwear Pakistan",
    "Shop premium cotton t-shirt with comfort fit and cash on delivery across Pakistan.",
    "Naram aur aala quality cotton t-shirt, daily use ke liye behtareen.",
    "Premium cotton tee drop! Comfort + style for everyday fit. #Smartwear #Pakistan",
    "Assalam o Alaikum! Yeh premium cotton t-shirt ab available hai. COD par order karein.",
    "true",
  ].map(toCsvCell).join(",");

  return [header, sampleRow].join("\n");
}

