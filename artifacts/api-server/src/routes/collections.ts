import { Router } from "express";
import { db, collectionsTable, productsTable, productCollectionsTable } from "@workspace/db";
import { eq, and, asc, inArray } from "drizzle-orm";

const router = Router();

/* ── GET /collections ─────────────────────────────────────────────────── */
router.get("/collections", async (req, res) => {
  try {
    const activeOnly = req.query["activeOnly"] === "true";
    const rows = await db
      .select()
      .from(collectionsTable)
      .where(activeOnly ? eq(collectionsTable.active, true) : undefined)
      .orderBy(asc(collectionsTable.sortOrder), asc(collectionsTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "listCollections failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── POST /collections ────────────────────────────────────────────────── */
router.post("/collections", async (req, res) => {
  try {
    const { name, slug, description, image, sortOrder = 0, active = true } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
    const [row] = await db
      .insert(collectionsTable)
      .values({ name, slug, description: description ?? null, image: image ?? null, sortOrder, active })
      .returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return res.status(400).json({ error: "A collection with this slug already exists" });
    }
    req.log.error({ err }, "createCollection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── GET /collections/:id ─────────────────────────────────────────────── */
router.get("/collections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, id));
    if (!row) return res.status(404).json({ error: "Collection not found" });
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "getCollection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── PUT /collections/:id ─────────────────────────────────────────────── */
router.put("/collections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ["name", "slug", "description", "image", "sortOrder", "active"] as const;
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const [row] = await db
      .update(collectionsTable)
      .set(update)
      .where(eq(collectionsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Collection not found" });
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "updateCollection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── DELETE /collections/:id ──────────────────────────────────────────── */
router.delete("/collections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db
      .delete(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Collection not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteCollection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── GET /collections/:id/products ───────────────────────────────────── */
router.get("/collections/:id/products", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id, 10);
    const assignments = await db
      .select({ productId: productCollectionsTable.productId })
      .from(productCollectionsTable)
      .where(eq(productCollectionsTable.collectionId, collectionId));

    if (assignments.length === 0) { res.json([]); return; }
    const ids = assignments.map(a => a.productId);
    const products = await db.select().from(productsTable).where(inArray(productsTable.id, ids));
    res.json(products.map(p => ({ ...p, collectionIds: [collectionId] })));
  } catch (err) {
    req.log.error({ err }, "getCollectionProducts failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── POST /collections/:id/products ──────────────────────────────────── */
router.post("/collections/:id/products", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id, 10);
    const { productIds } = req.body as { productIds: string[] };
    if (!Array.isArray(productIds) || productIds.length === 0)
      return res.status(400).json({ error: "productIds array is required" });

    await db
      .insert(productCollectionsTable)
      .values(productIds.map(pid => ({ productId: pid, collectionId, sortOrder: 0 })))
      .onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "addProductToCollection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── DELETE /collections/:id/products/:productId ─────────────────────── */
router.delete("/collections/:id/products/:productId", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id, 10);
    const productId    = req.params.productId;
    await db
      .delete(productCollectionsTable)
      .where(
        and(
          eq(productCollectionsTable.collectionId, collectionId),
          eq(productCollectionsTable.productId, productId),
        )
      );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "removeProductFromCollection failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
