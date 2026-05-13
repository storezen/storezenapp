import { randomUUID } from "node:crypto";
import { eq, and, inArray } from "drizzle-orm";
import { db, inventoryHistoryTable } from "../db";

export async function logInventoryChange(data: {
  productId: string;
  storeId: string;
  reason: "manual" | "order" | "restock" | "import";
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  referenceId?: string;
  note?: string;
  createdBy?: string;
}) {
  const [row] = await db
    .insert(inventoryHistoryTable)
    .values({ id: randomUUID(), ...data })
    .returning();
  return row;
}

export async function getInventoryHistory(productId: string, storeId: string, limit = 50) {
  return db
    .select()
    .from(inventoryHistoryTable)
    .where(and(eq(inventoryHistoryTable.productId, productId), eq(inventoryHistoryTable.storeId, storeId)))
    .orderBy(inventoryHistoryTable.createdAt)
    .limit(limit);
}

export async function bulkUpdateProducts(
  storeId: string,
  updates: {
    productIds: string[];
    action: "activate" | "deactivate" | "set_draft" | "publish";
    collectionIds?: string[];
    priceAdjust?: number; // +10% or -10%
  },
) {
  const { productIds, action, collectionIds, priceAdjust } = updates;

  if (productIds.length === 0) return { updated: 0 };

  // Update product status
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
    patch.priceAdjustment = String(priceAdjust);
  }

  const { setProductCollectionsForProduct } = await import("../repositories/store-collections.repository.js");

  let updated = 0;
  for (const id of productIds) {
    const { findProductById } = await import("../repositories/products.repository.js");
    const product = await findProductById(id);
    if (!product || product.storeId !== storeId) continue;

    const { updateProduct } = await import("../repositories/products.repository.js");
    let finalPatch = { ...patch };
    if (priceAdjust !== undefined && priceAdjust !== 0) {
      const basePrice = Number(product.price);
      const newPrice = Math.round(basePrice * (1 + priceAdjust / 100));
      finalPatch = { ...patch, price: String(newPrice) };
    }
    await updateProduct(id, finalPatch);
    updated++;

    if (collectionIds !== undefined) {
      try {
        await setProductCollectionsForProduct(id, storeId, collectionIds);
      } catch { /* ignore */ }
    }
  }

  return { updated };
}
