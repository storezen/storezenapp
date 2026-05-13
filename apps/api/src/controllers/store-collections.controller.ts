import { type Request, type Response } from "express";
import { z } from "zod";
import * as service from "../services/store-collections.service";

const ruleSchema = z.object({
  field: z.enum(["tag", "price", "product_type", "category"]),
  operator: z.enum([
    "eq",
    "equals",
    "contains",
    "gt",
    "gte",
    "lt",
    "lte",
    "greater_than",
    "less_than",
    "greater_or_equal",
    "less_or_equal",
  ]),
  value: z.string().min(1).max(500),
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  /** Max products in this collection on the storefront. */
  maxProducts: z.coerce.number().int().min(1).max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  collectionKind: z.enum(["manual", "smart"]).optional(),
  rules: z.array(ruleSchema).optional(),
});

const patchSchema = createSchema
  .partial()
  .extend({
    rules: z.array(ruleSchema).nullable().optional(),
  });

const productsBody = z.object({
  productIds: z.array(z.string().uuid()).min(0),
});

function toParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0]! : value;
}

export async function publicListController(req: Request, res: Response) {
  try {
    const slug = String(req.query["store_slug"] ?? "");
    if (!slug) return res.status(400).json({ error: "store_slug is required" });
    const list = await service.listForPublicStore(slug);
    return res.json({ collections: list });
  } catch {
    return res.status(500).json({ error: "Failed to load collections" });
  }
}

export async function merchantListController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const list = await service.listForMerchantEnriched(req.user.storeId);
    return res.json({ collections: list });
  } catch {
    return res.status(500).json({ error: "Failed to load collections" });
  }
}

export async function merchantCreateController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const row = await service.createCollection(req.user.storeId, parsed.data);
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Failed to create collection" });
  }
}

export async function merchantPatchController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toParam(req.params.id);
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const row = await service.patchCollection(id, req.user.storeId, parsed.data);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Failed to update collection" });
  }
}

export async function merchantDeleteController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toParam(req.params.id);
    const row = await service.removeCollection(id, req.user.storeId);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed to delete collection" });
  }
}

export async function merchantSetProductsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toParam(req.params.id);
    const parsed = productsBody.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const n = await service.linkProductsToCollection(id, req.user.storeId, parsed.data.productIds);
    return res.json({ linked: n });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to link products";
    if (msg === "NotFound") return res.status(404).json({ error: "Not found" });
    if (msg === "OverCollectionLimit") {
      const cap = e instanceof Error && "cap" in e ? (e as Error & { cap: number }).cap : 0;
      return res.status(400).json({ error: `At most ${cap} products allowed for this collection. Reduce the list or raise max products.` });
    }
    if (msg === "SmartCollectionReadOnly") {
      return res.status(400).json({
        error: "This is a smart collection — products are chosen automatically. Edit the rules on the collection instead.",
      });
    }
    return res.status(500).json({ error: msg });
  }
}

export async function merchantGetProductIdsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toParam(req.params.id);
    const ids = await service.getCollectionProductIds(id, req.user.storeId);
    if (ids === null) return res.status(404).json({ error: "Not found" });
    return res.json({ productIds: ids });
  } catch {
    return res.status(500).json({ error: "Failed to load" });
  }
}
