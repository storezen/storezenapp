import { z } from "zod";

export const publicProductsQuerySchema = z.object({
  store_slug: z.string().min(1),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "name_asc", "name_desc", "newest"])
    .optional(),
});

export const publicProductBySlugQuerySchema = z.object({
  store_slug: z.string().min(1),
});

export const storeProductsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
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
  variants: z.record(z.string(), z.unknown()).optional(),
  urduDescription: z.string().nullable().optional(),
  tiktokCaption: z.string().nullable().optional(),
  whatsappText: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDesc: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const importProductsSchema = z.object({
  csv: z.string().min(1),
  replaceExisting: z.boolean().optional(),
});

