import { randomUUID } from "node:crypto";
import { storeCollectionsTable } from "../db/schema";
import {
  deleteCollection,
  getCollectionByIdForStore,
  getProductIdsInCollection,
  insertCollection,
  listCollectionsByStoreId,
  listPublicCollectionsBySlug,
  listRulesByCollectionId,
  replaceCollectionRules,
  setCollectionProducts,
  updateCollection,
} from "../repositories/store-collections.repository";
import { db, storeCollectionProductsTable } from "../db";
import { eq } from "drizzle-orm";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function listForMerchant(storeId: string) {
  return listCollectionsByStoreId(storeId);
}

export async function listForMerchantEnriched(storeId: string) {
  const list = await listCollectionsByStoreId(storeId);
  return Promise.all(
    list.map(async (c) => {
      /** Admin table: count all products that match (including drafts). */
      const ids = await getProductIdsInCollection(c.id, storeId, false);
      const rules = c.collectionKind === "smart" ? await listRulesByCollectionId(c.id) : [];
      return {
        ...c,
        productCount: ids?.length ?? 0,
        rules: rules.map((r) => ({
          id: r.id,
          field: r.field,
          operator: r.operator,
          value: r.value,
        })),
        conditionsLabel:
          c.collectionKind === "smart"
            ? rules.map((r) => `${r.field} ${r.operator} ${r.value}`).join(" · ") || "Add rules"
            : "Manual selection",
      };
    }),
  );
}

export function listForPublicStore(storeSlug: string) {
  return listPublicCollectionsBySlug(storeSlug);
}

export async function createCollection(
  storeId: string,
  data: {
    name: string;
    slug?: string;
    description?: string | null;
    image?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    maxProducts?: number | null;
    collectionKind?: "manual" | "smart";
    rules?: { field: string; operator: string; value: string }[];
  },
) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const kind = data.collectionKind ?? "manual";
  const row = await insertCollection({
    id: randomUUID(),
    storeId,
    name: data.name,
    slug,
    description: data.description ?? null,
    image: data.image ?? null,
    sortOrder: data.sortOrder ?? 0,
    maxProducts: data.maxProducts ?? null,
    isActive: data.isActive ?? true,
    collectionKind: kind,
  });
  if (row && kind === "smart" && data.rules && data.rules.length > 0) {
    await replaceCollectionRules(
      row.id,
      data.rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value,
      })),
    );
  }
  return row;
}

export async function patchCollection(
  id: string,
  storeId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string | null;
    image?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    maxProducts?: number | null;
    collectionKind?: "manual" | "smart";
    rules?: { field: string; operator: string; value: string }[] | null;
  },
) {
  const current = await getCollectionByIdForStore(id, storeId);
  if (!current) return null;
  const { rules, ...fieldPatch } = data;
  const patch: Partial<typeof storeCollectionsTable.$inferInsert> = {};
  if (fieldPatch.name !== undefined) patch.name = fieldPatch.name;
  if (fieldPatch.name && !fieldPatch.slug) patch.slug = slugify(fieldPatch.name);
  if (fieldPatch.slug !== undefined) patch.slug = slugify(fieldPatch.slug);
  if (fieldPatch.description !== undefined) patch.description = fieldPatch.description;
  if (fieldPatch.image !== undefined) patch.image = fieldPatch.image;
  if (fieldPatch.sortOrder !== undefined) patch.sortOrder = fieldPatch.sortOrder;
  if (fieldPatch.isActive !== undefined) patch.isActive = fieldPatch.isActive;
  if (fieldPatch.maxProducts !== undefined) patch.maxProducts = fieldPatch.maxProducts;
  if (fieldPatch.collectionKind !== undefined) patch.collectionKind = fieldPatch.collectionKind;
  if (data.collectionKind === "smart" && current.collectionKind === "manual") {
    await db
      .delete(storeCollectionProductsTable)
      .where(eq(storeCollectionProductsTable.collectionId, id));
  }
  if (data.collectionKind === "manual" && current.collectionKind === "smart" && rules === undefined) {
    await replaceCollectionRules(id, []);
  }
  const row =
    Object.keys(patch).length > 0
      ? await updateCollection(id, storeId, patch)
      : current;
  if (rules != null) {
    await replaceCollectionRules(
      id,
      rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value,
      })),
    );
  }
  return (row ?? (await getCollectionByIdForStore(id, storeId))) || null;
}

export async function removeCollection(id: string, storeId: string) {
  return deleteCollection(id, storeId);
}

export async function linkProductsToCollection(
  collectionId: string,
  storeId: string,
  productIds: string[],
) {
  const col = await getCollectionByIdForStore(collectionId, storeId);
  if (!col) {
    const err = new Error("NotFound");
    throw err;
  }
  if (col.collectionKind === "smart") {
    const err = new Error("SmartCollectionReadOnly");
    throw err;
  }
  const cap = col.maxProducts;
  if (cap != null && cap > 0 && productIds.length > cap) {
    const err = new Error("OverCollectionLimit");
    (err as Error & { cap: number }).cap = cap;
    throw err;
  }
  return setCollectionProducts(collectionId, productIds, storeId);
}

export async function getCollectionProductIds(collectionId: string, storeId: string) {
  const ids = await getProductIdsInCollection(collectionId, storeId, false);
  if (ids === null) return null;
  return ids;
}
