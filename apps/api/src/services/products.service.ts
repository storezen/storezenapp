import { randomUUID } from "node:crypto";
import {
  listCollectionMembershipByStore,
  setProductCollectionsForProduct,
} from "../repositories/store-collections.repository";
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
import {
  analyzeProductImportFile,
  buildSimpleCsvFromMapping,
  parseRawCsvData,
  validateProductImportData,
  importSlugForRow,
  type ColumnMapping,
} from "../lib/csv-product-import";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeVariantsForDb(v: unknown[] | Record<string, unknown> | undefined): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  return [];
}

function ensureOwnership(storeId: string | null | undefined, resourceStoreId: string) {
  if (!storeId || storeId !== resourceStoreId) throw new Error("Forbidden");
}

export async function getPublicProducts(params: {
  storeSlug: string;
  category?: string;
  q?: string;
  sort?: string;
  collectionId?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ products: unknown[]; nextCursor: string | null }> {
  if (!params.storeSlug) throw new Error("store_slug is required");
  return listPublicProducts(params);
}

export async function getStoreProducts(params: {
  storeId: string;
  category?: string;
  q?: string;
  status?: "active" | "inactive";
  publishStatus?: "active" | "draft" | "all";
  collectionId?: string;
  stock?: "in_stock" | "out" | "low" | "all";
}) {
  const products = await listStoreProducts(params);
  const links = await listCollectionMembershipByStore(params.storeId);
  const m = new Map<string, { ids: string[]; names: string[] }>();
  for (const l of links) {
    const cur = m.get(l.productId) ?? { ids: [] as string[], names: [] as string[] };
    cur.ids.push(l.collectionId);
    cur.names.push(l.name);
    m.set(l.productId, cur);
  }
  return products.map((p) => {
    const c = m.get(p.id);
    return {
      ...p,
      collectionIds: c?.ids ?? [],
      collectionLabels: c?.names ?? [],
    };
  });
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
    variants?: unknown[] | Record<string, unknown>;
    urduDescription?: string | null;
    tiktokCaption?: string | null;
    whatsappText?: string | null;
    metaTitle?: string | null;
    metaDesc?: string | null;
    category?: string | null;
    tags?: unknown[];
    isActive?: boolean;
    isFeatured?: boolean;
    isDraft?: boolean;
    vendor?: string | null;
    productType?: string | null;
    sku?: string | null;
    barcode?: string | null;
    trackInventory?: boolean;
    sortOrder?: number;
    publishAt?: string | null;
    collectionIds?: string[];
  },
) {
  const slug = slugify(data.name);
  const isDraft = data.isDraft ?? false;
  const row = await createProduct({
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
    variants: normalizeVariantsForDb(data.variants),
    urduDescription: data.urduDescription ?? null,
    tiktokCaption: data.tiktokCaption ?? null,
    whatsappText: data.whatsappText ?? null,
    metaTitle: data.metaTitle ?? null,
    metaDesc: data.metaDesc ?? null,
    category: data.category ?? null,
    productType: data.productType ?? data.category ?? null,
    tags: data.tags ?? [],
    isActive: isDraft ? false : (data.isActive ?? true),
    isFeatured: data.isFeatured ?? false,
    isDraft,
    vendor: data.vendor?.trim() ? data.vendor.trim() : null,
    sku: data.sku?.trim() ? data.sku.trim() : null,
    barcode: data.barcode?.trim() ? data.barcode.trim() : null,
    trackInventory: data.trackInventory ?? true,
    sortOrder: data.sortOrder ?? null,
    publishAt: data.publishAt ? new Date(data.publishAt) : null,
  });
  if (row && data.collectionIds?.length) {
    const unique = [...new Set(data.collectionIds)];
    try {
      await setProductCollectionsForProduct(row.id, storeId, unique);
    } catch {
      /* ignore if collections invalid; product still created */
    }
  }
  return row;
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
    variants: unknown[] | Record<string, unknown>;
    urduDescription: string | null;
    tiktokCaption: string | null;
    whatsappText: string | null;
    metaTitle: string | null;
    metaDesc: string | null;
    category: string | null;
    tags: unknown[];
    isActive: boolean;
    isFeatured: boolean;
    isDraft: boolean;
    vendor: string | null;
    productType: string | null;
    sku: string | null;
    barcode: string | null;
    trackInventory: boolean;
    sortOrder: number;
    publishAt: string | null;
  }> & { collectionIds?: string[] },
) {
  const current = await findProductById(productId);
  if (!current) throw new Error("NotFound");
  ensureOwnership(storeId, current.storeId);

  const { collectionIds, ...rest } = data;
  const patch: Record<string, unknown> = { ...rest };
  if (data.name) patch.slug = slugify(data.name);
  if (data.price !== undefined) patch.price = String(data.price);
  if (data.salePrice !== undefined) patch.salePrice = data.salePrice != null ? String(data.salePrice) : null;
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice != null ? String(data.costPrice) : null;
  if (data.variants !== undefined) patch.variants = normalizeVariantsForDb(data.variants as unknown[] | Record<string, unknown>);
  if (data.vendor !== undefined) patch.vendor = data.vendor?.trim() ? data.vendor.trim() : null;
  if (data.sku !== undefined) patch.sku = data.sku?.trim() ? data.sku.trim() : null;
  if (data.barcode !== undefined) patch.barcode = data.barcode?.trim() ? data.barcode.trim() : null;
  if (data.productType !== undefined) patch.productType = data.productType?.trim() ? data.productType.trim() : null;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  if (data.publishAt !== undefined) patch.publishAt = data.publishAt ? new Date(data.publishAt) : null;
  if (data.isDraft === true) {
    patch.isActive = false;
  } else if (data.isDraft === false) {
    if (data.isActive === undefined) patch.isActive = true;
  }

  const updated = await updateProduct(productId, patch);
  if (!updated) throw new Error("NotFound");
  if (collectionIds !== undefined) {
    const unique = [...new Set(collectionIds)];
    try {
      await setProductCollectionsForProduct(productId, storeId, unique);
    } catch (e) {
      if (e instanceof Error && e.message === "CannotAssignSmartCollection") throw e;
    }
  }
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

export type ProductImportOptions = {
  /** When a product with the same link already exists, update it. */
  replaceExisting?: boolean;
  /** When a product already exists and you are not updating, do not import that row. */
  skipDuplicates?: boolean;
  /** Set from analyze step. When true, the raw CSV is passed through. */
  isShopify?: boolean;
  /** Map our fields to the column names from your file (Vendrix simple files only). */
  columnMap?: ColumnMapping;
};

function resolveImportCsv(
  rawCsv: string,
  options: ProductImportOptions,
): { csv: string; parseNote?: string } {
  if (options.isShopify) {
    return { csv: rawCsv };
  }
  if (options.columnMap && Object.keys(options.columnMap).length > 0) {
    const { headers, rows } = parseRawCsvData(rawCsv);
    if (headers.length === 0) {
      return { csv: rawCsv, parseNote: "empty" };
    }
    const data = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
    return { csv: buildSimpleCsvFromMapping(data, headers) };
  }
  return { csv: rawCsv };
}

export function analyzeStoreProductImport(_storeId: string, csv: string) {
  return analyzeProductImportFile(csv);
}

export async function validateStoreProductImport(
  _storeId: string,
  csv: string,
  isShopify: boolean,
  _columnMap: ColumnMapping,
) {
  const raw = parseRawCsvData(csv);
  const data = raw.rows.map((r) => Object.fromEntries(raw.headers.map((h, i) => [h, r[i] ?? ""])));
  const effectiveCsv = isShopify
    ? csv
    : buildSimpleCsvFromMapping(data, raw.headers);
  return validateProductImportData(effectiveCsv);
}

export async function importStoreProductsCsv(
  storeId: string,
  csv: string,
  replaceExistingOrOptions: boolean | ProductImportOptions = false,
) {
  const importOptions: ProductImportOptions =
    typeof replaceExistingOrOptions === "boolean" ? { replaceExisting: replaceExistingOrOptions } : replaceExistingOrOptions;
  const ro = importOptions.replaceExisting ?? false;
  const sd = importOptions.skipDuplicates !== false;
  const { isShopify, columnMap } = importOptions;
  const resolved = resolveImportCsv(csv, { replaceExisting: ro, skipDuplicates: sd, isShopify, columnMap });
  const csvIn = resolved.csv;
  if (resolved.parseNote === "empty") {
    throw new Error("No columns found. Check the file and try again.");
  }

  const parsed = parseCsvProducts(csvIn);
  if (parsed.products.length === 0) {
    throw new Error(parsed.errors[0] ?? "No valid products found in this file.");
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const rowFailures: { index: number; name: string; message: string }[] = [];
  const existingProducts = await listStoreProducts({ storeId });
  const existingBySlug = new Map(existingProducts.map((row) => [row.slug.toLowerCase(), row]));
  const seenInFile = new Set<string>();

  for (let idx = 0; idx < parsed.products.length; idx++) {
    const p = parsed.products[idx]!;
    const slug = importSlugForRow(p, idx);
    if (seenInFile.has(slug)) {
      skipped += 1;
      continue;
    }
    const existing = existingBySlug.get(slug);

    const payload: Record<string, unknown> = {
      name: p.name,
      slug,
      description: p.description ?? null,
      price: String(p.price),
      salePrice: p.compareAtPrice != null ? String(p.compareAtPrice) : null,
      stock: p.stock,
      category: p.category ?? null,
      vendor: p.vendor ?? null,
      productType: p.productType ?? null,
      sku: p.sku ?? null,
      images: p.images?.length ? p.images : p.image ? [p.image] : [],
      tags: p.tags ?? [],
      metaTitle: p.metaTitle ?? null,
      metaDesc: p.metaDescription ?? null,
      urduDescription: p.urduDescription ?? null,
      tiktokCaption: p.tiktokCaption ?? null,
      whatsappText: p.whatsappText ?? null,
      isActive: p.active,
      weight: p.weight ?? null,
      requiresShipping: p.requiresShipping ?? true,
    };

    try {
      if (existing && ro) {
        await updateProduct(existing.id, payload);
        seenInFile.add(slug);
        updated += 1;
        continue;
      }
      if (existing && !ro) {
        if (sd) {
          skipped += 1;
        } else {
          skipped += 1;
        }
        continue;
      }
      if (!existing) {
        const created = await createProduct({
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
          productType: (payload.productType as string | null) ?? (payload.category as string | null) ?? null,
          tags: (payload.tags as unknown[]) ?? [],
          isActive: Boolean(payload.isActive ?? true),
          isFeatured: false,
          isDraft: false,
          trackInventory: true,
          vendor: (payload.vendor as string | null) ?? null,
          sku: (payload.sku as string | null) ?? null,
        });
        if (created) {
          seenInFile.add(slug);
          existingBySlug.set(slug, created);
        }
        imported += 1;
      }
    } catch (e) {
      rowFailures.push({
        index: idx,
        name: p.name,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    imported,
    updated,
    skipped,
    rowFailures,
    errors: parsed.errors,
  };
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

  // Leading BOM so Excel recognizes UTF-8; `parseRawCsvData` / `parseCsvProducts` strip it on read.
  return "\uFEFF" + [header, sampleRow].join("\n");
}

