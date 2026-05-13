import { eq } from "drizzle-orm";
import { db, bundleItemsTable, bundlesTable, productsTable } from "../db";

export async function findBundlesByStoreId(storeId: string) {
  return db
    .select()
    .from(bundlesTable)
    .where(eq(bundlesTable.storeId, storeId))
    .orderBy(bundlesTable.createdAt);
}

export async function findBundleById(id: string) {
  const [bundle] = await db
    .select()
    .from(bundlesTable)
    .where(eq(bundlesTable.id, id))
    .limit(1);
  return bundle ?? null;
}

export async function findBundleByIdAndStore(id: string, storeId: string) {
  const [bundle] = await db
    .select()
    .from(bundlesTable)
    .where(eq(bundlesTable.id, id))
    .limit(1);
  return bundle && bundle.storeId === storeId ? bundle : null;
}

export async function findBundleItemsByBundleId(bundleId: string) {
  return db
    .select({
      id: bundleItemsTable.id,
      productId: bundleItemsTable.productId,
      quantity: bundleItemsTable.quantity,
      name: productsTable.name,
      price: productsTable.price,
      salePrice: productsTable.salePrice,
      image: productsTable.images,
    })
    .from(bundleItemsTable)
    .leftJoin(productsTable, eq(bundleItemsTable.productId, productsTable.id))
    .where(eq(bundleItemsTable.bundleId, bundleId));
}

export async function createBundle(data: {
  storeId: string;
  name: string;
  slug: string;
  discountType: string;
  discountValue: number;
}) {
  const [bundle] = await db
    .insert(bundlesTable)
    .values({
      id: crypto.randomUUID(),
      storeId: data.storeId,
      name: data.name,
      slug: data.slug,
      discountType: data.discountType,
      discountValue: String(data.discountValue),
    })
    .returning();
  return bundle;
}

export async function updateBundle(
  id: string,
  data: {
    name?: string;
    slug?: string;
    discountType?: string;
    discountValue?: number;
    isActive?: boolean;
  }
) {
  const [bundle] = await db
    .update(bundlesTable)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.discountType && { discountType: data.discountType }),
      ...(data.discountValue !== undefined && { discountValue: String(data.discountValue) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })
    .where(eq(bundlesTable.id, id))
    .returning();
  return bundle;
}

export async function deleteBundle(id: string) {
  await db.delete(bundleItemsTable).where(eq(bundleItemsTable.bundleId, id));
  await db.delete(bundlesTable).where(eq(bundlesTable.id, id));
}

export async function addBundleItem(bundleId: string, productId: string, quantity: number = 1) {
  const [item] = await db
    .insert(bundleItemsTable)
    .values({ bundleId, productId, quantity })
    .returning();
  return item;
}

export async function removeBundleItem(id: string) {
  await db.delete(bundleItemsTable).where(eq(bundleItemsTable.id, id));
}

export async function updateBundleItem(id: string, quantity: number) {
  const [item] = await db
    .update(bundleItemsTable)
    .set({ quantity })
    .where(eq(bundleItemsTable.id, id))
    .returning();
  return item;
}

export async function clearBundleItems(bundleId: string) {
  await db.delete(bundleItemsTable).where(eq(bundleItemsTable.bundleId, bundleId));
}