import { z } from "zod";

export const updateMyStoreSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo: z.string().url().optional(),
  whatsappNumber: z.string().min(7).max(50).optional(),
});

export const updateStoreThemeSchema = z.object({
  theme: z.string().min(1).max(100).optional(),
  themeColors: z.unknown().optional(),
});

export const updateStorePixelSchema = z.object({
  tiktokPixel: z.string().max(255).optional(),
});

export const updateStoreDeliverySchema = z.object({
  delivery_settings: z.unknown().optional(),
}).passthrough();

export const updateStorePaymentSchema = z.object({
  payment_methods: z.unknown().optional(),
}).passthrough();

export const updateStorePagesSchema = z.object({
  home_blocks: z.array(z.unknown()).optional(),
  homeBlocks: z.array(z.unknown()).optional(),
});

