import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, productsTable, storesTable } from "../db";

type ProductStatus = "active" | "inactive";

type PublicFilter = {
  storeSlug: string;
  category?: string;
  q?: string;
  sort?: string;
};

type PrivateFilter = {
  storeId: string;
  category?: string;
  q?: string;
  status?: ProductStatus;
};

export async function findStoreBySlug(slug: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(and(eq(storesTable.slug, slug), eq(storesTable.isActive, true)))
    .limit(1);
  return store ?? null;
}

export async function listPublicProducts(filter: PublicFilter) {
  const store = await findStoreBySlug(filter.storeSlug);
  if (!store) return [];

  let orderBy = desc(productsTable.createdAt);
  if (filter.sort === "price_asc") orderBy = asc(productsTable.price);
  if (filter.sort === "price_desc") orderBy = desc(productsTable.price);
  if (filter.sort === "name_asc") orderBy = asc(productsTable.name);
  if (filter.sort === "name_desc") orderBy = desc(productsTable.name);

  return db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.storeId, store.id),
        eq(productsTable.isActive, true),
        filter.category ? eq(productsTable.category, filter.category) : undefined,
        filter.q
          ? or(
              ilike(productsTable.name, `%${filter.q}%`),
              ilike(productsTable.description, `%${filter.q}%`),
              ilike(productsTable.category, `%${filter.q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(orderBy);
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
        eq(productsTable.isActive, true),
        or(eq(productsTable.slug, slug), eq(productsTable.id, slug)),
      ),
    )
    .limit(1);

  return product ?? null;
}

export async function listStoreProducts(filter: PrivateFilter) {
  return db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.storeId, filter.storeId),
        filter.category ? eq(productsTable.category, filter.category) : undefined,
        filter.status ? eq(productsTable.isActive, filter.status === "active") : undefined,
        filter.q
          ? or(
              ilike(productsTable.name, `%${filter.q}%`),
              ilike(productsTable.description, `%${filter.q}%`),
              ilike(productsTable.category, `%${filter.q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(productsTable.createdAt));
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

