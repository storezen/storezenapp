import { type Request, type Response } from "express";
import {
  getAdminPlatformSettings,
  getPlatformStats,
  getStores,
  getUsers,
  toggleStore,
  toggleUser,
  updateAdminPlatformSettings,
  updateUserPlanByAdmin,
  updateStoreOwnerPlan,
} from "../services/admin.service";
import { listLowStockProducts, listOutOfStockProducts, listTopProductsByStock, listAllProductsAdmin } from "../repositories/products.repository";
import {
  adminStoresQuerySchema,
  adminUsersQuerySchema,
  updatePlatformSettingsSchema,
  updateStorePlanSchema,
  updateUserPlanSchema,
} from "../validators/admin.validator";

function one(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export async function getAdminStatsController(_req: Request, res: Response) {
  try {
    const stats = await getPlatformStats();
    return res.json(stats);
  } catch {
    return res.status(500).json({ error: "Failed to fetch admin stats" });
  }
}

export async function listStoresController(req: Request, res: Response) {
  try {
    const parsed = adminStoresQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const query = parsed.data;
    const stores = await getStores({
      page: query.page ?? 1,
      search: query.search,
      status: query.status,
    });
    return res.json({ stores });
  } catch {
    return res.status(500).json({ error: "Failed to list stores" });
  }
}

export async function toggleStoreController(req: Request, res: Response) {
  try {
    const storeId = one(req.params.id);
    const store = await toggleStore(storeId);
    return res.json(store);
  } catch (error) {
    if (error instanceof Error && error.message === "StoreNotFound") {
      return res.status(404).json({ error: "Store not found" });
    }
    return res.status(500).json({ error: "Failed to toggle store" });
  }
}

export async function updateStorePlanController(req: Request, res: Response) {
  try {
    const storeId = one(req.params.id);
    const parsed = updateStorePlanSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { plan } = parsed.data;
    const user = await updateStoreOwnerPlan(storeId, plan);
    return res.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "StoreNotFound") {
      return res.status(404).json({ error: "Store not found" });
    }
    return res.status(500).json({ error: "Failed to update plan" });
  }
}

export async function listUsersController(req: Request, res: Response) {
  try {
    const parsed = adminUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const query = parsed.data;
    const users = await getUsers({
      page: query.page ?? 1,
      search: query.search,
    });
    return res.json({ users });
  } catch {
    return res.status(500).json({ error: "Failed to list users" });
  }
}

export async function toggleUserBanController(req: Request, res: Response) {
  try {
    const userId = one(req.params.id);
    const user = await toggleUser(userId);
    return res.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "UserNotFound") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Failed to update user ban state" });
  }
}

export async function updateUserPlanController(req: Request, res: Response) {
  try {
    const userId = one(req.params.id);
    const parsed = updateUserPlanSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const user = await updateUserPlanByAdmin(userId, parsed.data.plan);
    return res.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "UserNotFound") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Failed to update user plan" });
  }
}

export async function getPlatformSettingsController(_req: Request, res: Response) {
  try {
    const settings = await getAdminPlatformSettings();
    return res.json(settings);
  } catch {
    return res.status(500).json({ error: "Failed to fetch platform settings" });
  }
}

export async function updatePlatformSettingsController(req: Request, res: Response) {
  try {
    const parsed = updatePlatformSettingsSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const settings = await updateAdminPlatformSettings(parsed.data);
    return res.json(settings);
  } catch {
    return res.status(500).json({ error: "Failed to update platform settings" });
  }
}

export async function getLowStockController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const products = await listLowStockProducts(req.user.storeId);
    return res.json({ products });
  } catch {
    return res.status(500).json({ error: "Failed to fetch low stock products" });
  }
}

export async function getOutOfStockController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const products = await listOutOfStockProducts(req.user.storeId);
    return res.json({ products });
  } catch {
    return res.status(500).json({ error: "Failed to fetch out of stock products" });
  }
}

export async function getTopStockController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const products = await listTopProductsByStock(req.user.storeId);
    return res.json({ products });
  } catch {
    return res.status(500).json({ error: "Failed to fetch top stock products" });
  }
}

export async function listAllProductsController(req: Request, res: Response) {
  try {
    const search = req.query.q as string | undefined;
    const status = req.query.status as "active" | "draft" | "all" | undefined;
    const limit = Number(req.query.limit) || 100;
    const products = await listAllProductsAdmin({ limit, search, status });
    return res.json({ products });
  } catch {
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

