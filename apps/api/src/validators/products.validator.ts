import { z } from "zod";

const productVariantItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  image: z.string().url().optional(),
});

export const publicProductsQuerySchema = z.object({
  store_slug: z.string().min(1),
  category: z.string().optional(),
  collection_id: z.string().uuid().optional(),
  q: z.string().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "name_asc", "name_desc", "newest"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});

export const publicProductBySlugQuerySchema = z.object({
  store_slug: z.string().min(1),
});

export const storeProductsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  publishStatus: z.enum(["active", "draft", "all"]).optional(),
  collectionId: z.string().uuid().optional(),
  stock: z.enum(["in_stock", "out", "low", "all"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.coerce.number().nonnegative(),
  salePrice: z.coerce.number().nonnegative().nullable().optional(),
  costPrice: z.coerce.number().nonnegative().nullable().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  images: z.array(z.unknown()).optional(),
  variants: z.union([z.array(productVariantItemSchema), z.record(z.string(), z.unknown())]).optional(),
  urduDescription: z.string().nullable().optional(),
  tiktokCaption: z.string().nullable().optional(),
  whatsappText: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDesc: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  vendor: z.string().nullable().optional(),
  productType: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  trackInventory: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  publishAt: z.string().nullable().optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

const csvBodyField = z.string().min(1).max(5_000_000);
const columnMapField = z.record(z.string().nullable()).optional();

export const productImportAnalyzeSchema = z.object({
  csv: csvBodyField,
});

export const productImportValidateSchema = z.object({
  csv: csvBodyField,
  isShopify: z.boolean(),
  columnMap: columnMapField,
});

export const importProductsSchema = z.object({
  csv: csvBodyField,
  replaceExisting: z.boolean().optional(),
  skipDuplicates: z.boolean().optional(),
  isShopify: z.boolean().optional(),
  columnMap: columnMapField,
});

