import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  createProductController,
  deleteProductController,
  exportProductsController,
  getPublicProductBySlugController,
  getPublicProductsController,
  productsTemplateController,
  getStoreProductsController,
  importProductsController,
  productImportAnalyzeController,
  productImportValidateController,
  toggleProductController,
  updateProductController,
} from "../controllers/products.controller";

const router = Router();

// Note: /products/public and /products/public/:slug are handled in routes/index.ts to avoid auth conflicts
// Unauthenticated product endpoints go through index.ts first
router.get("/products", authenticate, getStoreProductsController);
router.post("/products", authenticate, createProductController);
router.put("/products/:id", authenticate, updateProductController);
router.delete("/products/:id", authenticate, deleteProductController);
router.put("/products/:id/toggle", authenticate, toggleProductController);
router.get("/products/export", authenticate, exportProductsController);
router.get("/products/template", authenticate, productsTemplateController);
router.post("/products/import/analyze", authenticate, productImportAnalyzeController);
router.post("/products/import/validate", authenticate, productImportValidateController);
router.post("/products/import", authenticate, importProductsController);

export default router;
