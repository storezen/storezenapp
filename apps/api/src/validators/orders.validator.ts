import { z } from "zod";

export const orderStatusValues = [
  "new",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

export const placeOrderSchema = z.object({
  storeId: z.string().uuid(),
  customerName: z.string().min(2).max(255),
  customerPhone: z.string().min(7).max(50),
  customerCity: z.string().min(2).max(255),
  customerAddress: z.string().min(5),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        variantId: z.string().min(1).optional(),
      }),
    )
    .min(1),
  paymentMethod: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(orderStatusValues).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(500).optional(),
  search: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
});

export const trackOrderQuerySchema = z
  .object({
    id: z.string().uuid().optional(),
    phone: z.string().min(7).max(50).optional(),
  })
  .refine((v) => Boolean(v.id || v.phone), {
    message: "id or phone is required",
  });

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(orderStatusValues),
});

