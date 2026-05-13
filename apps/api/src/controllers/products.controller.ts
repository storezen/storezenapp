import { type Request, type Response } from "express";
import {
  createStoreProduct,
  deleteStoreProduct,
  exportStoreProductsCsv,
  getProductsCsvTemplate,
  getPublicProductBySlug,
  getPublicProducts,
  getStoreProducts,
  importStoreProductsCsv,
  validateStoreProductImport,
  analyzeStoreProductImport,
  toggleStoreProduct,
  updateStoreProduct,
} from "../services/products.service";
import {
  createProductSchema,
  importProductsSchema,
  productImportAnalyzeSchema,
  productImportValidateSchema,
  publicProductBySlugQuerySchema,
  publicProductsQuerySchema,
  storeProductsQuerySchema,
  updateProductSchema,
} from "../validators/products.validator";
import type { ColumnMapping } from "../lib/csv-product-import";

function toSingleParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export async function getPublicProductsController(req: Request, res: Response) {
  try {
    const parsed = publicProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { store_slug, category, q, sort, collection_id: collectionId, limit, cursor } = parsed.data;
    const { products, nextCursor } = await getPublicProducts({
      storeSlug: store_slug,
      category,
      q,
      sort,
      collectionId,
      limit,
      cursor,
    });
    return res.json({ products, nextCursor });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load public products";
    if (msg === "store_slug is required") return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function getPublicProductBySlugController(req: Request, res: Response) {
  try {
    const parsed = publicProductBySlugQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const slug = toSingleParam(req.params.slug);
    const product = await getPublicProductBySlug({
      storeSlug: parsed.data.store_slug,
      slug,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load public product";
    if (msg === "store_slug is required" || msg === "slug is required") return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function getStoreProductsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = storeProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { category, q, status, publishStatus, collectionId, stock } = parsed.data;
    const products = await getStoreProducts({
      storeId: req.user.storeId,
      category,
      q,
      status,
      publishStatus,
      collectionId,
      stock: stock && stock !== "all" ? stock : undefined,
    });
    return res.json({ products });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load products";
    return res.status(500).json({ error: msg });
  }
}

export async function createProductController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }

    const product = await createStoreProduct(req.user.storeId, parsed.data);
    return res.status(201).json(product);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create product";
    return res.status(500).json({ error: msg });
  }
}

export async function updateProductController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = toSingleParam(req.params.id);
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const product = await updateStoreProduct(req.user.storeId, productId, parsed.data);
    return res.json(product);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update product";
    if (msg === "NotFound") return res.status(404).json({ error: "Product not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    return res.status(500).json({ error: msg });
  }
}

export async function deleteProductController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = toSingleParam(req.params.id);
    await deleteStoreProduct(req.user.storeId, productId);
    return res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete product";
    if (msg === "NotFound") return res.status(404).json({ error: "Product not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    return res.status(500).json({ error: msg });
  }
}

export async function toggleProductController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const productId = toSingleParam(req.params.id);
    const product = await toggleStoreProduct(req.user.storeId, productId);
    return res.json(product);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to toggle product";
    if (msg === "NotFound") return res.status(404).json({ error: "Product not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    return res.status(500).json({ error: msg });
  }
}

export async function exportProductsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const csv = await exportStoreProductsCsv(req.user.storeId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    return res.status(200).send(csv);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to export products";
    return res.status(500).json({ error: msg });
  }
}

export async function importProductsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = importProductsSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { csv, replaceExisting, skipDuplicates, isShopify, columnMap } = parsed.data;
    const result = await importStoreProductsCsv(req.user.storeId, csv, {
      replaceExisting: replaceExisting ?? false,
      skipDuplicates: skipDuplicates !== false,
      isShopify: isShopify ?? false,
      columnMap: (columnMap ?? {}) as ColumnMapping,
    });
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to import products";
    if (msg.includes("No valid products")) return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function productImportAnalyzeController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = productImportAnalyzeSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const result = analyzeStoreProductImport(req.user.storeId, parsed.data.csv);
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to read file";
    return res.status(500).json({ error: msg });
  }
}

export async function productImportValidateController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = productImportValidateSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { csv, isShopify, columnMap } = parsed.data;
    const out = await validateStoreProductImport(
      req.user.storeId,
      csv,
      isShopify,
      (columnMap ?? {}) as ColumnMapping,
    );
    return res.json(out);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to validate import";
    return res.status(500).json({ error: msg });
  }
}

export async function productsTemplateController(_req: Request, res: Response) {
  try {
    const csv = getProductsCsvTemplate();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=products-template.csv");
    return res.status(200).send(csv);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate template";
    return res.status(500).json({ error: msg });
  }
}

