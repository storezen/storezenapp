import { z } from "zod";

export const adminStoresQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export const updateStorePlanSchema = z.object({
  plan: z.string().min(1).max(50),
});

export const updateUserPlanSchema = z.object({
  plan: z.string().min(1).max(50),
});

export const updatePlatformSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

