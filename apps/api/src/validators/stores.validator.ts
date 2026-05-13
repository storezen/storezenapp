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
  metaPixel: z.string().max(128).optional(),
});

export const updateStoreDeliverySchema = z.object({
  delivery_settings: z.unknown().optional(),
}).passthrough();

export const updateStorePaymentSchema = z.object({
  payment_methods: z.unknown().optional(),
}).passthrough();

const campaignChannel = z.enum(["meta", "tiktok", "email", "other"]);
const campaignStatus = z.enum(["draft", "active", "paused", "ended"]);

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  channel: campaignChannel.optional(),
  status: campaignStatus.optional(),
  budget: z.string().optional(),
  spend: z.string().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateCampaignSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    channel: campaignChannel.optional(),
    status: campaignStatus.optional(),
    budget: z.string().optional(),
    spend: z.string().optional(),
    impressions: z.coerce.number().int().min(0).optional(),
    clicks: z.coerce.number().int().min(0).optional(),
    conversions: z.coerce.number().int().min(0).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((o) => Object.values(o).some((v) => v !== undefined), { message: "At least one field required" });

