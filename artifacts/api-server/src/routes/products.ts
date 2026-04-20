import { Router } from "express";
import { db, productsTable, productCollectionsTable } from "@workspace/db";
import { eq, and, or, ilike, asc, desc, sql, inArray } from "drizzle-orm";
import { parseCsvProducts } from "../lib/csv-parser.js";

const router = Router();

/* ── helpers ─────────────────────────────────────────────────────────── */
async function attachCollectionIds(products: (typeof productsTable.$inferSelect)[]) {
  if (products.length === 0) return products.map(p => ({ ...p, collectionIds: [] as number[] }));
  const ids = products.map(p => p.id);
  const links = await db
    .select({ productId: productCollectionsTable.productId, collectionId: productCollectionsTable.collectionId })
    .from(productCollectionsTable)
    .where(inArray(productCollectionsTable.productId, ids));
  const map = new Map<string, number[]>();
  for (const l of links) {
    if (!map.has(l.productId)) map.set(l.productId, []);
    map.get(l.productId)!.push(l.collectionId);
  }
  return products.map(p => ({ ...p, collectionIds: map.get(p.id) ?? [] }));
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function buildId(name: string, existingId?: string): string {
  const base = existingId || slugify(name) || 'product';
  return base.slice(0, 60);
}

/* ── GET /products ────────────────────────────────────────────────────── */
router.get("/products", async (req, res) => {
  try {
    const { collectionId, category, search, activeOnly, limit = "100", offset = "0" } = req.query as Record<string, string>;
    const limitN  = Math.min(parseInt(limit) || 100, 500);
    const offsetN = parseInt(offset) || 0;

    // Filter by collectionId (join)
    if (collectionId) {
      const colId = parseInt(collectionId);
      const links = await db
        .select({ productId: productCollectionsTable.productId })
        .from(productCollectionsTable)
        .where(eq(productCollectionsTable.collectionId, colId));
      const pids = links.map(l => l.productId);
      if (pids.length === 0) { res.json({ products: [], total: 0, limit: limitN, offset: offsetN }); return; }

      const rows = await db.select().from(productsTable)
        .where(and(
          inArray(productsTable.id, pids),
          activeOnly === "true" ? eq(productsTable.active, true) : undefined,
          category ? eq(productsTable.category, category) : undefined,
          search ? or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.category, `%${search}%`)) : undefined,
        ))
        .orderBy(desc(productsTable.createdAt))
        .limit(limitN)
        .offset(offsetN);

      const products = await attachCollectionIds(rows);
      res.json({ products, total: products.length, limit: limitN, offset: offsetN });
      return;
    }

    const where = and(
      activeOnly === "true" ? eq(productsTable.active, true) : undefined,
      category ? eq(productsTable.category, category) : undefined,
      search ? or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.category, `%${search}%`)) : undefined,
    );

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(where);

    const rows = await db.select().from(productsTable)
      .where(where)
      .orderBy(desc(productsTable.createdAt))
      .limit(limitN)
      .offset(offsetN);

    const products = await attachCollectionIds(rows);
    res.json({ products, total: count, limit: limitN, offset: offsetN });
  } catch (err) {
    req.log.error({ err }, "listProducts failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── POST /products/import ────────────────────────────────────────────── */
router.post("/products/import", async (req, res) => {
  try {
    const { csv, collectionId, replaceExisting = false } = req.body as {
      csv: string; collectionId?: number; replaceExisting?: boolean;
    };
    if (!csv || typeof csv !== "string") return res.status(400).json({ error: "csv field is required" });

    const { products: parsed, errors } = parseCsvProducts(csv);
    if (parsed.length === 0) return res.status(400).json({ error: "No valid products found in CSV", errors });

    const importedProducts: (typeof productsTable.$inferSelect)[] = [];
    let importedCount = 0;
    let updatedCount  = 0;

    for (const p of parsed) {
      const id = buildId(p.name, p.id);
      const row = {
        id,
        name: p.name,
        slug: p.slug ?? slugify(p.name),
        description: p.description ?? null,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        category: p.category,
        image: p.image,
        images: p.images,
        tags: p.tags,
        active: p.active,
        metaTitle: p.metaTitle ?? null,
        metaDescription: p.metaDescription ?? null,
        variants: null,
      };

      if (replaceExisting) {
        const [result] = await db
          .insert(productsTable)
          .values(row)
          .onConflictDoUpdate({ target: productsTable.id, set: { ...row } })
          .returning();
        importedProducts.push(result);
        updatedCount++;
      } else {
        const [result] = await db
          .insert(productsTable)
          .values(row)
          .onConflictDoNothing()
          .returning();
        if (result) { importedProducts.push(result); importedCount++; }
      }
    }

    // Assign to collection if given
    if (collectionId && importedProducts.length > 0) {
      await db
        .insert(productCollectionsTable)
        .values(importedProducts.map(p => ({ productId: p.id, collectionId, sortOrder: 0 })))
        .onConflictDoNothing();
    }

    const products = await attachCollectionIds(importedProducts);
    res.json({ imported: importedCount, updated: updatedCount, errors, products });
  } catch (err) {
    req.log.error({ err }, "importProducts failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── POST /products ───────────────────────────────────────────────────── */
router.post("/products", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const { name, price, category, image } = body;
    if (!name || price === undefined || !category) return res.status(400).json({ error: "name, price, and category are required" });

    const id = buildId(name as string, body.id as string | undefined);
    const row = {
      id,
      name: name as string,
      slug: (body.slug as string) ?? slugify(name as string),
      description: (body.description as string) ?? null,
      price: parseInt(String(price)),
      compareAtPrice: body.compareAtPrice != null ? parseInt(String(body.compareAtPrice)) : null,
      stock: parseInt(String(body.stock ?? 0)),
      category: category as string,
      image: (image as string) ?? "",
      images: (body.images as string[]) ?? [],
      tags: (body.tags as string[]) ?? [],
      active: body.active !== false,
      variants: body.variants ?? null,
      metaTitle: (body.metaTitle as string) ?? null,
      metaDescription: (body.metaDescription as string) ?? null,
    };

    const [result] = await db.insert(productsTable).values(row).returning();
    const collectionIds = (body.collectionIds as number[]) ?? [];
    if (collectionIds.length > 0) {
      await db.insert(productCollectionsTable)
        .values(collectionIds.map(cid => ({ productId: result.id, collectionId: cid, sortOrder: 0 })))
        .onConflictDoNothing();
    }
    res.status(201).json({ ...result, collectionIds });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return res.status(400).json({ error: "A product with this ID already exists" });
    }
    req.log.error({ err }, "createProduct failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── GET /products/:id ────────────────────────────────────────────────── */
router.get("/products/:id", async (req, res) => {
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    const [enriched] = await attachCollectionIds([product]);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "getProduct failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── PUT /products/:id ────────────────────────────────────────────────── */
router.put("/products/:id", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const allowed = ["name","slug","description","price","compareAtPrice","stock","category","image","images","tags","active","variants","metaTitle","metaDescription"] as const;
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];
    if (body.price !== undefined) update.price = parseInt(String(body.price));
    if (body.compareAtPrice !== undefined) update.compareAtPrice = body.compareAtPrice != null ? parseInt(String(body.compareAtPrice)) : null;
    if (body.stock !== undefined) update.stock = parseInt(String(body.stock));

    const [result] = await db
      .update(productsTable)
      .set(update)
      .where(eq(productsTable.id, req.params.id))
      .returning();
    if (!result) return res.status(404).json({ error: "Product not found" });

    // Update collection assignments if provided
    const collectionIds = body.collectionIds as number[] | undefined;
    if (collectionIds !== undefined) {
      await db.delete(productCollectionsTable).where(eq(productCollectionsTable.productId, req.params.id));
      if (collectionIds.length > 0) {
        await db.insert(productCollectionsTable)
          .values(collectionIds.map(cid => ({ productId: result.id, collectionId: cid, sortOrder: 0 })))
          .onConflictDoNothing();
      }
    }

    const [enriched] = await attachCollectionIds([result]);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "updateProduct failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── DELETE /products/:id ─────────────────────────────────────────────── */
router.delete("/products/:id", async (req, res) => {
  try {
    const [row] = await db.delete(productsTable).where(eq(productsTable.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteProduct failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── GET /products/:id/collections ───────────────────────────────────── */
router.get("/products/:id/collections", async (req, res) => {
  try {
    const links = await db
      .select({ collectionId: productCollectionsTable.collectionId })
      .from(productCollectionsTable)
      .where(eq(productCollectionsTable.productId, req.params.id));
    if (links.length === 0) { res.json([]); return; }
    const { collectionsTable: ct } = await import("@workspace/db");
    const colls = await db.select().from(ct).where(inArray(ct.id, links.map(l => l.collectionId)));
    res.json(colls);
  } catch (err) {
    req.log.error({ err }, "getProductCollections failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
