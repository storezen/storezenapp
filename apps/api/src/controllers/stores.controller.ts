import { type Request, type Response } from "express";
import { resolveHomePageFromDb } from "../lib/home-page";
import {
  addMyCampaign,
  getMyCampaignsList,
  getMyStore,
  getMyStoreAnalytics,
  getMyStorePages,
  getMyStoreStats,
  getPublicStore,
  patchMyCampaign,
  removeMyCampaign,
  updateMyStore,
  updateStoreDelivery,
  updateStorePages,
  updateStorePayment,
  updateStorePixel,
  updateStoreTheme,
} from "../services/stores.service";
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateMyStoreSchema,
  updateStoreDeliverySchema,
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
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
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
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
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
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
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
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
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
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const store = await updateStorePayment(requireUserId(req), parsed.data.payment_methods ?? parsed.data);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to update payment methods" });
  }
}

export async function getMyStorePagesController(req: Request, res: Response) {
  try {
    const data = await getMyStorePages(requireUserId(req));
    return res.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to load page content" });
  }
}

export async function updateStorePagesController(req: Request, res: Response) {
  try {
    const row = await updateStorePages(requireUserId(req), req.body);
    if (!row) return res.json({ homePage: null, updatedAt: null });
    return res.json({
      homePage: resolveHomePageFromDb(row.homeBlocks),
      updatedAt: row.updatedAt?.toISOString?.() ?? (row.updatedAt ? String(row.updatedAt) : null),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    if (error instanceof Error && error.message === "Invalid home page content") {
      return res.status(400).json({
        error: error.message,
        details: (error as Error & { zod?: unknown }).zod,
      });
    }
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

function parseDaysParam(req: Request) {
  const q = req.query.days;
  const raw = Array.isArray(q) ? q[0] : q;
  const p = typeof raw === "string" ? parseInt(raw, 10) : typeof raw === "number" ? raw : NaN;
  return p && !Number.isNaN(p) ? p : 30;
}

export async function getMyStoreAnalyticsController(req: Request, res: Response) {
  try {
    const days = Math.min(90, Math.max(1, parseDaysParam(req)));
    const data = await getMyStoreAnalytics(requireUserId(req), days);
    return res.json({ days: data.days, summary: data.summary, repeatPurchase: data.repeatPurchase, cohorts: data.cohorts });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}

export async function getMyCampaignsController(req: Request, res: Response) {
  try {
    const out = await getMyCampaignsList(requireUserId(req));
    return res.json(out);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to load campaigns" });
  }
}

export async function createMyCampaignController(req: Request, res: Response) {
  try {
    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const row = await addMyCampaign(requireUserId(req), {
      name: parsed.data.name,
      channel: parsed.data.channel,
      status: parsed.data.status,
      budget: parsed.data.budget,
      spend: parsed.data.spend,
      notes: parsed.data.notes ?? null,
    });
    return res.status(201).json(row);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    return res.status(500).json({ error: "Failed to create campaign" });
  }
}

export async function patchMyCampaignController(req: Request, res: Response) {
  try {
    const id = toSingleParam(req.params.id);
    const parsed = updateCampaignSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const row = await patchMyCampaign(requireUserId(req), id, parsed.data);
    return res.json(row);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    if (error instanceof Error && error.message === "NotFound") return res.status(404).json({ error: "Not found" });
    return res.status(500).json({ error: "Failed to update campaign" });
  }
}

export async function deleteMyCampaignController(req: Request, res: Response) {
  try {
    const id = toSingleParam(req.params.id);
    await removeMyCampaign(requireUserId(req), id);
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (error instanceof Error && error.message === "StoreNotFound") return res.status(404).json({ error: "Store not found" });
    if (error instanceof Error && error.message === "NotFound") return res.status(404).json({ error: "Not found" });
    return res.status(500).json({ error: "Failed to delete campaign" });
  }
}

