import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  productsTable,
  storeCollectionProductsTable,
  storeCollectionRulesTable,
  storeCollectionsTable,
  storesTable,
} from "../db";
import { productMatchesRules, type CollectionRule } from "./smart-collection";

export async function listCollectionsByStoreId(storeId: string) {
  return db
    .select()
    .from(storeCollectionsTable)
    .where(eq(storeCollectionsTable.storeId, storeId))
    .orderBy(asc(storeCollectionsTable.sortOrder), asc(storeCollectionsTable.name));
}

export async function getCollectionByIdForStore(id: string, storeId: string) {
  const [row] = await db
    .select()
    .from(storeCollectionsTable)
    .where(and(eq(storeCollectionsTable.id, id), eq(storeCollectionsTable.storeId, storeId)))
    .limit(1);
  return row ?? null;
}

export async function insertCollection(data: typeof storeCollectionsTable.$inferInsert) {
  const [row] = await db.insert(storeCollectionsTable).values(data).returning();
  return row ?? null;
}

export async function updateCollection(
  id: string,
  storeId: string,
  patch: Partial<typeof storeCollectionsTable.$inferInsert>,
) {
  const [row] = await db
    .update(storeCollectionsTable)
    .set(patch)
    .where(and(eq(storeCollectionsTable.id, id), eq(storeCollectionsTable.storeId, storeId)))
    .returning();
  return row ?? null;
}

export async function deleteCollection(id: string, storeId: string) {
  const [row] = await db
    .delete(storeCollectionsTable)
    .where(and(eq(storeCollectionsTable.id, id), eq(storeCollectionsTable.storeId, storeId)))
    .returning();
  return row ?? null;
}

export async function listRulesByCollectionId(collectionId: string): Promise<CollectionRule[]> {
  return db.select().from(storeCollectionRulesTable).where(eq(storeCollectionRulesTable.collectionId, collectionId));
}

export async function replaceCollectionRules(
  collectionId: string,
  rules: { field: string; operator: string; value: string }[],
) {
  await db
    .delete(storeCollectionRulesTable)
    .where(eq(storeCollectionRulesTable.collectionId, collectionId));
  if (rules.length === 0) return;
  await db.insert(storeCollectionRulesTable).values(
    rules.map((r) => ({
      collectionId,
      field: r.field,
      operator: r.operator,
      value: r.value,
    })),
  );
}

function isLiveOnStore(p: { isActive: boolean | null; isDraft: boolean | null }) {
  if (p.isActive === false) return false;
  if (p.isDraft === true) return false;
  return true;
}

export async function setCollectionProducts(
  collectionId: string,
  productIds: string[],
  storeId: string,
) {
  const col = await getCollectionByIdForStore(collectionId, storeId);
  if (!col) throw new Error("NotFound");
  if (col.collectionKind === "smart") {
    const err = new Error("SmartCollectionReadOnly");
    throw err;
  }
  const valid = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.storeId, storeId), inArray(productsTable.id, productIds)));
  const idSet = new Set(valid.map((r) => r.id));
  const ordered = productIds.filter((id) => idSet.has(id));
  await db.delete(storeCollectionProductsTable).where(eq(storeCollectionProductsTable.collectionId, collectionId));
  if (ordered.length === 0) return 0;
  await db.insert(storeCollectionProductsTable).values(
    ordered.map((productId, i) => ({
      collectionId,
      productId,
      sortOrder: i,
    })),
  );
  return ordered.length;
}

export async function getProductIdsInCollection(
  collectionId: string,
  storeId: string,
  /**
   * When true (default), smart collections only return products that are published on the storefront.
   * When false, match rules against all store products (for admin preview counts).
   */
  storefrontOnly = true,
) {
  const col = await getCollectionByIdForStore(collectionId, storeId);
  if (!col) return null;
  if (col.collectionKind === "smart") {
    const rules = await listRulesByCollectionId(collectionId);
    if (rules.length === 0) return [];
    const prods = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.storeId, storeId));
    const matching = prods
      .filter((p) => {
        if (storefrontOnly && !isLiveOnStore(p)) return false;
        return productMatchesRules(
          {
            price: p.price,
            category: p.category,
            productType: p.productType,
            tags: p.tags,
            isActive: p.isActive,
            isDraft: p.isDraft,
          },
          rules,
        );
      })
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    let ids = matching.map((p) => p.id);
    const cap = col.maxProducts;
    if (cap != null && cap > 0) ids = ids.slice(0, cap);
    return ids;
  }
  const rows = await db
    .select({ productId: storeCollectionProductsTable.productId })
    .from(storeCollectionProductsTable)
    .where(eq(storeCollectionProductsTable.collectionId, collectionId))
    .orderBy(asc(storeCollectionProductsTable.sortOrder));
  return rows.map((r) => r.productId);
}

/** Replace all manual collection links for a product in one request. */
export async function setProductCollectionsForProduct(
  productId: string,
  storeId: string,
  collectionIds: string[],
) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.storeId, storeId)))
    .limit(1);
  if (!product) return null;

  for (const cid of collectionIds) {
    const c = await getCollectionByIdForStore(cid, storeId);
    if (!c) throw new Error("CollectionNotFound");
    if (c.collectionKind === "smart") {
      const err = new Error("CannotAssignSmartCollection");
      throw err;
    }
  }

  const manualList = await db
    .select({ id: storeCollectionsTable.id })
    .from(storeCollectionsTable)
    .where(
      and(eq(storeCollectionsTable.storeId, storeId), eq(storeCollectionsTable.collectionKind, "manual")),
    );
  const manualIds = manualList.map((m) => m.id);
  if (manualIds.length > 0) {
    await db
      .delete(storeCollectionProductsTable)
      .where(
        and(
          eq(storeCollectionProductsTable.productId, productId),
          inArray(storeCollectionProductsTable.collectionId, manualIds),
        ),
      );
  }
  for (const cid of collectionIds) {
    const nextOrder = await db
      .select({ n: storeCollectionProductsTable.sortOrder })
      .from(storeCollectionProductsTable)
      .where(eq(storeCollectionProductsTable.collectionId, cid))
      .orderBy(desc(storeCollectionProductsTable.sortOrder))
      .limit(1);
    const sortOrder = (nextOrder[0]?.n ?? -1) + 1;
    await db.insert(storeCollectionProductsTable).values({ collectionId: cid, productId, sortOrder });
  }
  return { ok: true as const };
}

export async function listCollectionMembershipByStore(storeId: string) {
  return db
    .select({
      productId: storeCollectionProductsTable.productId,
      collectionId: storeCollectionsTable.id,
      name: storeCollectionsTable.name,
    })
    .from(storeCollectionProductsTable)
    .innerJoin(
      storeCollectionsTable,
      eq(storeCollectionProductsTable.collectionId, storeCollectionsTable.id),
    )
    .where(
      and(
        eq(storeCollectionsTable.storeId, storeId),
        eq(storeCollectionsTable.collectionKind, "manual"),
      ),
    );
}

export async function getManualCollectionIdsForProduct(productId: string, storeId: string) {
  const rows = await db
    .select({ collectionId: storeCollectionProductsTable.collectionId })
    .from(storeCollectionProductsTable)
    .innerJoin(
      storeCollectionsTable,
      eq(storeCollectionProductsTable.collectionId, storeCollectionsTable.id),
    )
    .where(
      and(
        eq(storeCollectionProductsTable.productId, productId),
        eq(storeCollectionsTable.storeId, storeId),
        eq(storeCollectionsTable.collectionKind, "manual"),
      ),
    );
  return rows.map((r) => r.collectionId);
}

export async function listPublicCollectionsBySlug(storeSlug: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(and(eq(storesTable.slug, storeSlug), eq(storesTable.isActive, true)))
    .limit(1);
  if (!store) return [];
  return db
    .select({
      id: storeCollectionsTable.id,
      name: storeCollectionsTable.name,
      slug: storeCollectionsTable.slug,
      image: storeCollectionsTable.image,
      sortOrder: storeCollectionsTable.sortOrder,
      maxProducts: storeCollectionsTable.maxProducts,
    })
    .from(storeCollectionsTable)
    .where(and(eq(storeCollectionsTable.storeId, store.id), eq(storeCollectionsTable.isActive, true)))
    .orderBy(asc(storeCollectionsTable.sortOrder), asc(storeCollectionsTable.name));
}

export async function findPublicCollectionBySlugForStore(
  storeSlug: string,
  collectionSlug: string,
) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(and(eq(storesTable.slug, storeSlug), eq(storesTable.isActive, true)))
    .limit(1);
  if (!store) return null;
  const [c] = await db
    .select()
    .from(storeCollectionsTable)
    .where(
      and(
        eq(storeCollectionsTable.storeId, store.id),
        eq(storeCollectionsTable.slug, collectionSlug),
        eq(storeCollectionsTable.isActive, true),
      ),
    )
    .limit(1);
  return c ?? null;
}
