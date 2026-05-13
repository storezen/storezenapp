import { type Request, type Response } from "express";
import {
  bulkUpdateProducts,
  getInventoryHistory,
  logInventoryChange,
} from "../services/inventory.service";
import {
  reserveStock,
  confirmReservation,
  getActiveReservations,
} from "../services/stock-reservation.service";
import {
  findProductById,
  updateProduct,
  listStoreProducts,
} from "../repositories/products.repository";

function one(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export async function bulkUpdateProductsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const { productIds, action, collectionIds, priceAdjust } = req.body as {
      productIds: string[];
      action: "activate" | "deactivate" | "set_draft" | "publish";
      collectionIds?: string[];
      priceAdjust?: number;
    };

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "productIds array is required" });
    }
    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    const { setProductCollectionsForProduct } = await import("../repositories/store-collections.repository.js");

    let updated = 0;
    for (const id of productIds) {
      const product = await findProductById(id);
      if (!product || product.storeId !== req.user.storeId) continue;

      const patch: Record<string, unknown> = {};
      if (action === "activate") {
        patch.isActive = true;
        patch.isDraft = false;
      } else if (action === "deactivate") {
        patch.isActive = false;
      } else if (action === "set_draft") {
        patch.isDraft = true;
        patch.isActive = false;
      } else if (action === "publish") {
        patch.isDraft = false;
        patch.isActive = true;
      }

      if (priceAdjust !== undefined && priceAdjust !== 0) {
        const basePrice = Number(product.price);
        const newPrice = Math.round(basePrice * (1 + priceAdjust / 100));
        patch.price = String(newPrice);
      }

      if (Object.keys(patch).length > 0) {
        await updateProduct(id, patch);
        updated++;
      }

      if (collectionIds !== undefined) {
        try {
          await setProductCollectionsForProduct(id, req.user.storeId, collectionIds);
        } catch { /* ignore */ }
      }
    }

    return res.json({ updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Bulk update failed";
    return res.status(500).json({ error: msg });
  }
}

export async function reorderProductsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const { productOrders } = req.body as { productOrders: { id: string; sortOrder: number }[] };
    if (!productOrders || !Array.isArray(productOrders)) {
      return res.status(400).json({ error: "productOrders array is required" });
    }

    let updated = 0;
    for (const { id, sortOrder } of productOrders) {
      const product = await findProductById(id);
      if (!product || product.storeId !== req.user.storeId) continue;
      await updateProduct(id, { sortOrder });
      updated++;
    }

    return res.json({ updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Reorder failed";
    return res.status(500).json({ error: msg });
  }
}

export async function getInventoryHistoryController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = one(req.params.productId);
    const history = await getInventoryHistory(productId, req.user.storeId);
    return res.json({ history });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch inventory history";
    return res.status(500).json({ error: msg });
  }
}

export async function logInventoryChangeController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = one(req.params.productId);
    const { reason, quantityChange, stockAfter, note } = req.body;

    const product = await findProductById(productId);
    if (!product || product.storeId !== req.user.storeId) {
      return res.status(404).json({ error: "Product not found" });
    }

    const stockBefore = product.stock ?? 0;
    const entry = await logInventoryChange({
      productId,
      storeId: req.user.storeId,
      reason: reason ?? "manual",
      quantityChange: quantityChange ?? 0,
      stockBefore,
      stockAfter: stockAfter ?? stockBefore,
      note,
      createdBy: req.user.id,
    });

    // Update product stock
    await updateProduct(productId, { stock: stockAfter ?? stockBefore });

    return res.json({ entry });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to log inventory change";
    return res.status(500).json({ error: msg });
  }
}

export async function reserveStockController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = one(req.params.productId);
    const { sessionId, quantity } = req.body;

    if (!sessionId || !quantity) {
      return res.status(400).json({ error: "sessionId and quantity are required" });
    }

    const reservation = await reserveStock(productId, req.user.storeId, sessionId, quantity);
    return res.json({ reservation });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reserve stock";
    return res.status(500).json({ error: msg });
  }
}

export async function confirmReservationController(req: Request, res: Response) {
  try {
    const id = one(req.params.id);
    const reservation = await confirmReservation(id);
    if (!reservation) return res.status(404).json({ error: "Reservation not found" });
    return res.json({ reservation });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to confirm reservation";
    return res.status(500).json({ error: msg });
  }
}

export async function getActiveReservationsController(req: Request, res: Response) {
  try {
    const sessionId = String(req.query.sessionId ?? "");
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    const reservations = await getActiveReservations(sessionId);
    return res.json({ reservations });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get reservations";
    return res.status(500).json({ error: msg });
  }
}
