import { z } from "zod";

export const shippingCourierSchema = z.enum(["postex", "leopards"]);

export const bookShippingSchema = z.object({
  orderId: z.string().uuid(),
  courier: shippingCourierSchema,
});

export const syncShippingSchema = z.object({
  courier: shippingCourierSchema.optional(),
});

export const updateShippingSettingsSchema = z
  .object({
    shipping: z.unknown().optional(),
  })
  .passthrough();
