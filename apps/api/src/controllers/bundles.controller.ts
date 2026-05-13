import { type Request, type Response } from "express";
import {
  addProductToBundle,
  createBundle,
  deleteBundle,
  findBundlesByStoreId,
  getBundleWithItems,
  removeProductFromBundle,
  updateBundle,
  updateBundleProductQuantity,
} from "../services/bundles.service";
import { getFrequentlyBoughtTogether } from "../services/bundles.service";

function toSingleParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export async function listBundlesController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const bundles = await findBundlesByStoreId(req.user.storeId);

    const bundlesWithItems = await Promise.all(
      bundles.map(async (bundle) => {
        const items = await getBundleWithItems(bundle.id, req.user!.storeId!);
        return items;
      })
    );

    return res.json({ bundles: bundlesWithItems });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to list bundles";
    return res.status(500).json({ error: msg });
  }
}

export async function getBundleController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);

    const bundle = await getBundleWithItems(id, req.user.storeId);
    if (!bundle) return res.status(404).json({ error: "Bundle not found" });

    return res.json({ bundle });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get bundle";
    return res.status(500).json({ error: msg });
  }
}

export async function createBundleController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const { name, slug, discountType, discountValue, items } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    const bundle = await createBundle({
      storeId: req.user.storeId,
      name,
      slug,
      discountType: discountType || "percentage",
      discountValue: Number(discountValue) || 0,
      items: items || [],
    });

    return res.status(201).json({ bundle });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create bundle";
    return res.status(500).json({ error: msg });
  }
}

export async function updateBundleController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const { name, slug, discountType, discountValue, isActive } = req.body;

    const bundle = await updateBundle(id, req.user.storeId, {
      name,
      slug,
      discountType,
      discountValue: discountValue !== undefined ? Number(discountValue) : undefined,
      isActive,
    });

    return res.json({ bundle });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update bundle";
    if (msg === "Bundle not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function deleteBundleController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);

    await deleteBundle(id, req.user.storeId);
    return res.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete bundle";
    if (msg === "Bundle not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function addItemToBundleController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const { productId, quantity } = req.body;

    if (!productId) return res.status(400).json({ error: "Product ID is required" });

    const item = await addProductToBundle(id, req.user.storeId, productId, quantity || 1);
    return res.status(201).json({ item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to add item";
    if (msg === "Bundle not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function removeItemFromBundleController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const itemId = toSingleParam(req.params.itemId);

    await removeProductFromBundle(id, req.user.storeId, itemId);
    return res.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to remove item";
    if (msg === "Bundle not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function updateBundleItemController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const itemId = toSingleParam(req.params.itemId);
    const { quantity } = req.body;

    await updateBundleProductQuantity(id, req.user.storeId, itemId, quantity);
    return res.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update item";
    if (msg === "Bundle not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function getFrequentlyBoughtTogetherController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = String(req.query.productId ?? "");
    if (!productId) return res.status(400).json({ error: "productId is required" });
    const limit = Math.min(Number(req.query.limit ?? 4), 8);
    const products = await getFrequentlyBoughtTogether(req.user.storeId, productId, limit);
    return res.json({ products });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get recommendations";
    return res.status(500).json({ error: msg });
  }
}