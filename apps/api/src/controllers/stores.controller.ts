import { type Request, type Response } from "express";
import {
  getMyStore,
  getMyStoreStats,
  getPublicStore,
  updateMyStore,
  updateStoreDelivery,
  updateStorePages,
  updateStorePayment,
  updateStorePixel,
  updateStoreTheme,
} from "../services/stores.service";
import {
  updateMyStoreSchema,
  updateStoreDeliverySchema,
  updateStorePagesSchema,
  updateStorePaymentSchema,
  updateStorePixelSchema,
  updateStoreThemeSchema,
} from "../validators/stores.validator";

function toSingleParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

function requireUserId(req: Request) {
  if (!req.user?.id) throw new Error("Unauthorized");
  return req.user.id;
}

export async function getStoreBySlugController(req: Request, res: Response) {
  try {
    const slug = toSingleParam(req.params.slug);
    const store = await getPublicStore(slug);
    if (!store) return res.status(404).json({ error: "Store not found" });
    return res.json(store);
  } catch {
    return res.status(500).json({ error: "Failed to load store" });
  }
}

export async function getMyStoreController(req: Request, res: Response) {
  try {
    const store = await getMyStore(requireUserId(req));
    if (!store) return res.status(404).json({ error: "Store not found" });
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    return res.status(500).json({ error: "Failed to load store" });
  }
}

export async function updateMyStoreController(req: Request, res: Response) {
  try {
    const parsed = updateMyStoreSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const store = await updateMyStore(requireUserId(req), parsed.data);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update store" });
  }
}

export async function updateStoreThemeController(req: Request, res: Response) {
  try {
    const parsed = updateStoreThemeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const store = await updateStoreTheme(requireUserId(req), parsed.data);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update theme" });
  }
}

export async function updateStorePixelController(req: Request, res: Response) {
  try {
    const parsed = updateStorePixelSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const store = await updateStorePixel(requireUserId(req), parsed.data);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update pixel" });
  }
}

export async function updateStoreDeliveryController(req: Request, res: Response) {
  try {
    const parsed = updateStoreDeliverySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const store = await updateStoreDelivery(requireUserId(req), parsed.data.delivery_settings ?? parsed.data);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update delivery settings" });
  }
}

export async function updateStorePaymentController(req: Request, res: Response) {
  try {
    const parsed = updateStorePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const store = await updateStorePayment(requireUserId(req), parsed.data.payment_methods ?? parsed.data);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update payment methods" });
  }
}

export async function updateStorePagesController(req: Request, res: Response) {
  try {
    const parsed = updateStorePagesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const pages = await updateStorePages(requireUserId(req), parsed.data.home_blocks ?? parsed.data.homeBlocks ?? []);
    return res.json(pages);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update pages" });
  }
}

export async function getStoreStatsController(req: Request, res: Response) {
  try {
    const payload = await getMyStoreStats(requireUserId(req));
    return res.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to load store stats" });
  }
}

