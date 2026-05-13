import { eq, and, desc } from "drizzle-orm";
import { db, bundlesTable, bundleItemsTable, productsTable, ordersTable } from "../db";
import {
  addBundleItem,
  deleteBundle as deleteBundleRepo,
  findBundleById,
  findBundleByIdAndStore,
  findBundleItemsByBundleId,
  findBundlesByStoreId,
  removeBundleItem,
  updateBundle as updateBundleRepo,
  updateBundleItem,
} from "../repositories/bundles.repository";

export { findBundlesByStoreId, findBundleById, findBundleByIdAndStore, findBundleItemsByBundleId };

export async function getFrequentlyBoughtTogether(storeId: string, productId: string, limit = 4) {
  const productOrders = await db
    .select({ orderId: ordersTable.id })
    .from(ordersTable)
    .where(eq(ordersTable.storeId, storeId));

  const orderIds = productOrders.map((o) => o.orderId);
  if (orderIds.length === 0) return [];

  const bundles = await db
    .select()
    .from(bundlesTable)
    .where(and(eq(bundlesTable.storeId, storeId), eq(bundlesTable.isActive, true)));

  const relatedProducts: Set<string> = new Set();
  for (const bundle of bundles) {
    const items = await db
      .select()
      .from(bundleItemsTable)
      .where(eq(bundleItemsTable.bundleId, bundle.id));

    for (const item of items) {
      if (item.productId !== productId) {
        relatedProducts.add(item.productId);
      }
    }
  }

  if (relatedProducts.size === 0) return [];

  const ids = [...relatedProducts].slice(0, limit);
  const [first] = ids;
  if (!first) return [];

  const products = await db.select().from(productsTable).where(eq(productsTable.id, first));
  return products.filter((p) => p.isActive && !p.isDraft && p.id !== productId);
}

export async function createBundle(data: {
  storeId: string;
  name: string;
  slug: string;
  discountType: string;
  discountValue: number;
  items?: { productId: string; quantity: number }[];
}) {
  const bundle = await (await import("../repositories/bundles.repository.js")).createBundle(data);

  if (data.items?.length) {
    for (const item of data.items) {
      await addBundleItem(bundle.id, item.productId, item.quantity);
    }
  }

  return bundle;
}

export async function updateBundle(id: string, storeId: string, data: {
  name?: string;
  slug?: string;
  discountType?: string;
  discountValue?: number;
  isActive?: boolean;
}) {
  const existing = await findBundleByIdAndStore(id, storeId);
  if (!existing) throw new Error("Bundle not found");
  return updateBundleRepo(id, data);
}

export async function deleteBundle(id: string, storeId: string) {
  const existing = await findBundleByIdAndStore(id, storeId);
  if (!existing) throw new Error("Bundle not found");
  await deleteBundleRepo(id);
  return { ok: true };
}

export async function addProductToBundle(bundleId: string, storeId: string, productId: string, quantity: number = 1) {
  const bundle = await findBundleByIdAndStore(bundleId, storeId);
  if (!bundle) throw new Error("Bundle not found");
  return addBundleItem(bundleId, productId, quantity);
}

export async function removeProductFromBundle(bundleId: string, storeId: string, itemId: string) {
  const bundle = await findBundleByIdAndStore(bundleId, storeId);
  if (!bundle) throw new Error("Bundle not found");
  await removeBundleItem(itemId);
  return { ok: true };
}

export async function updateBundleProductQuantity(bundleId: string, storeId: string, itemId: string, quantity: number) {
  const bundle = await findBundleByIdAndStore(bundleId, storeId);
  if (!bundle) throw new Error("Bundle not found");
  if (quantity <= 0) {
    await removeBundleItem(itemId);
  } else {
    await updateBundleItem(itemId, quantity);
  }
  return { ok: true };
}

export async function getBundleWithItems(id: string, storeId: string) {
  const bundle = await findBundleByIdAndStore(id, storeId);
  if (!bundle) throw new Error("Bundle not found");
  const items = await findBundleItemsByBundleId(id);
  return {
    ...bundle,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      name: item.name ?? "",
      price: Number(item.price ?? 0),
      salePrice: item.salePrice ? Number(item.salePrice) : null,
      images: typeof item.image === "string" ? JSON.parse(item.image) : item.image,
    })),
  };
}

export function calculateBundlePrice(items: { price: number; quantity: number }[], discountType: string, discountValue: number) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  if (discountType === "percentage") {
    discount = (subtotal * discountValue) / 100;
  } else if (discountType === "flat") {
    discount = discountValue;
  }
  return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}