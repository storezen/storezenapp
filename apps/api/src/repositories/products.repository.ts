import { and, asc, desc, eq, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db, productsTable, storesTable } from "../db";
import { getCollectionByIdForStore, getProductIdsInCollection } from "./store-collections.repository";

type PublicFilter = {
  storeSlug: string;
  category?: string;
  q?: string;
  sort?: string;
  collectionId?: string;
  /** Max rows returned (default 200, max applied in service/validator). */
  limit?: number;
  /** Cursor: product ID to start after (exclusive). */
  cursor?: string;
};

type PrivateFilter = {
  storeId: string;
  category?: string;
  q?: string;
  status?: "active" | "inactive";
  /** active = published, draft = isDraft true, all = any */
  publishStatus?: "active" | "draft" | "all";
  collectionId?: string;
  stock?: "in_stock" | "out" | "low" | "all";
};

export async function findStoreBySlug(slug: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(and(eq(storesTable.slug, slug), eq(storesTable.isActive, true)))
    .limit(1);
  return store ?? null;
}

function sortPublicRows<T extends { id: string; name: string; price: string; createdAt: Date | null }>(
  rows: T[],
  sort: string | undefined,
): T[] {
  const copy = [...rows];
  if (sort === "price_asc") copy.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === "price_desc") copy.sort((a, b) => Number(b.price) - Number(a.price));
  else if (sort === "name_asc") copy.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name_desc") copy.sort((a, b) => b.name.localeCompare(a.name));
  else
    copy.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  return copy;
}

export async function listPublicProducts(filter: PublicFilter) {
  const store = await findStoreBySlug(filter.storeSlug);
  if (!store) return { products: [], nextCursor: null };

  const maxRows = Math.min(filter.limit ?? 200, 200);

  let productIds: string[] | null = null;
  if (filter.collectionId) {
    const col = await getCollectionByIdForStore(filter.collectionId, store.id);
    if (!col || !col.isActive) return { products: [], nextCursor: null };
    const ids = await getProductIdsInCollection(filter.collectionId, store.id);
    if (ids === null) return { products: [], nextCursor: null };
    if (ids.length === 0) return { products: [], nextCursor: null };
    const cap = col.maxProducts;
    productIds = cap != null && cap > 0 ? ids.slice(0, cap) : ids;
  }

  let orderBy = desc(productsTable.createdAt);
  if (filter.sort === "price_asc") orderBy = asc(productsTable.price);
  if (filter.sort === "price_desc") orderBy = desc(productsTable.price);
  if (filter.sort === "name_asc") orderBy = asc(productsTable.name);
  if (filter.sort === "name_desc") orderBy = desc(productsTable.name);

  const now = new Date();
  const publishedWhere = and(
    eq(productsTable.isActive, true),
    or(eq(productsTable.isDraft, false), isNull(productsTable.isDraft)),
    or(sql`${productsTable.publishAt} is null`, lte(productsTable.publishAt, now)),
  );

  const baseWhere = and(
    eq(productsTable.storeId, store.id),
    publishedWhere,
    productIds ? inArray(productsTable.id, productIds) : undefined,
    filter.category ? eq(productsTable.category, filter.category) : undefined,
    filter.q
      ? or(
          ilike(productsTable.name, `%${filter.q}%`),
          ilike(productsTable.description, `%${filter.q}%`),
          ilike(productsTable.category, `%${filter.q}%`),
        )
      : undefined,
  );

  if (productIds && productIds.length > 0) {
    const rows = await db.select().from(productsTable).where(baseWhere);
    const orderMap = new Map(productIds.map((id, i) => [id, i]));
    let out = [...rows].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    if (filter.sort && filter.sort !== "newest") {
      out = sortPublicRows(out, filter.sort);
    }
    let startIdx = filter.cursor ? (out.findIndex((p) => p.id === filter.cursor) + 1) : 0;
    if (startIdx < 0) startIdx = 0;
    const slice = out.slice(startIdx, startIdx + maxRows);
    const nextCursor = slice.length === maxRows && startIdx + maxRows < out.length ? slice[slice.length - 1]!.id : null;
    return { products: slice, nextCursor };
  }

  const rows = await db.select().from(productsTable).where(baseWhere).orderBy(orderBy);
  let startIdx = 0;
  if (filter.cursor) {
    const idx = rows.findIndex((p) => p.id === filter.cursor);
    startIdx = idx >= 0 ? idx + 1 : 0;
  }
  const slice = rows.slice(startIdx, startIdx + maxRows);
  const nextCursor = slice.length === maxRows ? slice[slice.length - 1]!.id : null;
  return { products: slice, nextCursor };
}

export async function findPublicProductBySlug(storeSlug: string, slug: string) {
  const store = await findStoreBySlug(storeSlug);
  if (!store) return null;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.storeId, store.id),
        or(eq(productsTable.isDraft, false), isNull(productsTable.isDraft)),
        eq(productsTable.isActive, true),
        or(eq(productsTable.slug, slug), eq(productsTable.id, slug)),
      ),
    )
    .limit(1);

  return product ?? null;
}

export async function listStoreProducts(filter: PrivateFilter) {
  let inCollectionIds: string[] | undefined;
  if (filter.collectionId) {
    const col = await getCollectionByIdForStore(filter.collectionId, filter.storeId);
    if (!col) inCollectionIds = [];
    else {
      const ids = await getProductIdsInCollection(filter.collectionId, filter.storeId, false);
      inCollectionIds = ids === null ? [] : ids;
    }
  }
  if (inCollectionIds && inCollectionIds.length === 0) {
    return [];
  }
  return db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.storeId, filter.storeId),
        inCollectionIds ? inArray(productsTable.id, inCollectionIds) : undefined,
        filter.category ? eq(productsTable.category, filter.category) : undefined,
        filter.status ? eq(productsTable.isActive, filter.status === "active") : undefined,
        filter.publishStatus === "draft"
          ? eq(productsTable.isDraft, true)
          : filter.publishStatus === "active"
            ? or(eq(productsTable.isDraft, false), isNull(productsTable.isDraft))
            : undefined,
        filter.stock === "out"
          ? or(eq(productsTable.stock, 0), isNull(productsTable.stock))
          : filter.stock === "in_stock"
            ? sql`coalesce(${productsTable.stock}, 0) > 0`
            : filter.stock === "low"
              ? sql`coalesce(${productsTable.stock}, 0) > 0 and coalesce(${productsTable.stock}, 0) <= coalesce(${productsTable.lowStockThreshold}, 5)`
              : undefined,
        filter.q
          ? or(
              ilike(productsTable.name, `%${filter.q}%`),
              ilike(productsTable.description, `%${filter.q}%`),
              ilike(productsTable.category, `%${filter.q}%`),
              ilike(productsTable.sku, `%${filter.q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(productsTable.createdAt));
}

export async function listStoreProductsPaginated(params: {
  storeId: string;
  category?: string;
  q?: string;
  status?: "active" | "inactive";
  publishStatus?: "active" | "draft" | "all";
  collectionId?: string;
  stock?: "in_stock" | "out" | "low" | "all";
  limit?: number;
  cursor?: string;
}) {
  const { cursor, limit = 20, ...rest } = params;
  const rows = await listStoreProducts({ ...rest });
  let startIdx = 0;
  if (cursor) {
    const idx = rows.findIndex((p) => p.id === cursor);
    startIdx = idx >= 0 ? idx + 1 : 0;
  }
  const slice = rows.slice(startIdx, startIdx + limit);
  const nextCursor = slice.length === limit ? slice[slice.length - 1]!.id : null;
  return {
    products: slice,
    nextCursor,
    total: rows.length,
    hasMore: nextCursor != null,
  };
}

export async function findProductById(id: string) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  return product ?? null;
}

export async function createProduct(data: typeof productsTable.$inferInsert) {
  const [product] = await db.insert(productsTable).values(data).returning();
  return product;
}

export async function updateProduct(id: string, data: Partial<typeof productsTable.$inferInsert>) {
  const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
  return product ?? null;
}

export async function deleteProduct(id: string) {
  const [product] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
  return product ?? null;
}

export async function listLowStockProducts(storeId: string, threshold?: number) {
  return db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.storeId, storeId),
        sql`coalesce(${productsTable.stock}, 0) > 0 and coalesce(${productsTable.stock}, 0) <= coalesce(${productsTable.lowStockThreshold}, ${threshold ?? 5})`,
      ),
    )
    .orderBy(asc(productsTable.stock));
}

export async function listOutOfStockProducts(storeId: string) {
  return db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.storeId, storeId),
        or(eq(productsTable.stock, 0), isNull(productsTable.stock)),
      ),
    )
    .orderBy(desc(productsTable.createdAt));
}

export async function listTopProductsByStock(storeId: string, limit = 10) {
  return db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.storeId, storeId), sql`coalesce(${productsTable.stock}, 0) > 0`))
    .orderBy(desc(productsTable.stock))
    .limit(limit);
}

// Admin: List all products across all stores
export async function listAllProductsAdmin(params: { limit?: number; search?: string; status?: "active" | "draft" | "all" }) {
  const { limit = 100, search, status } = params;

  let query = db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      price: productsTable.price,
      salePrice: productsTable.salePrice,
      stock: productsTable.stock,
      category: productsTable.category,
      isActive: productsTable.isActive,
      isDraft: productsTable.isDraft,
      images: productsTable.images,
      tags: productsTable.tags,
      sku: productsTable.sku,
      lowStockThreshold: productsTable.lowStockThreshold,
      createdAt: productsTable.createdAt,
      storeId: productsTable.storeId,
    })
    .from(productsTable);

  // Apply filters
  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(productsTable.name, `%${search}%`),
      ilike(productsTable.sku, `%${search}%`),
      ilike(productsTable.category, `%${search}%`),
    ));
  }
  if (status === "active") {
    conditions.push(eq(productsTable.isActive, true), eq(productsTable.isDraft, false));
  } else if (status === "draft") {
    conditions.push(eq(productsTable.isDraft, true));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.orderBy(desc(productsTable.createdAt)).limit(limit);
}
