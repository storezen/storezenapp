import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(2).max(100),
  type: z.enum(["percent", "fixed", "free_delivery"]),
  value: z.coerce.number().nonnegative(),
  minOrder: z.coerce.number().nonnegative().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  usedCount: z.coerce.number().int().nonnegative().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
});

export const validateCouponQuerySchema = z.object({
  code: z.string().min(2),
  store_slug: z.string().min(1),
  total: z.coerce.number().nonnegative(),
});

