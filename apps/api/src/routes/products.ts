import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requirePermission } from "../middlewares/rbac";
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

// All routes now have tenant + auth via parent router
// RBAC permissions applied:

// Read products (viewer, manager, admin, owner)
router.get("/", authenticate, requirePermission("products:read"), getStoreProductsController);

// Create products (manager, admin, owner)
router.post("/", authenticate, requirePermission("products:create"), createProductController);

// Update products (manager, admin, owner)
router.put("/:id", authenticate, requirePermission("products:update"), updateProductController);

// Delete products (admin, owner only)
router.delete("/:id", authenticate, requirePermission("products:delete"), deleteProductController);

// Toggle active (manager, admin, owner)
router.put("/:id/toggle", authenticate, requirePermission("products:update"), toggleProductController);

// Export (manager, admin, owner)
router.get("/export", authenticate, requirePermission("products:read"), exportProductsController);
router.get("/template", authenticate, requirePermission("products:read"), productsTemplateController);

// Import (manager, admin, owner)
router.post("/import/analyze", authenticate, requirePermission("products:create"), productImportAnalyzeController);
router.post("/import/validate", authenticate, requirePermission("products:create"), productImportValidateController);
router.post("/import", authenticate, requirePermission("products:create"), importProductsController);

export default router;
