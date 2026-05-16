import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requirePermission } from "../middlewares/rbac";
import {
  merchantCreateController,
  merchantDeleteController,
  merchantGetProductIdsController,
  merchantListController,
  merchantPatchController,
  merchantSetProductsController,
  publicListController,
} from "../controllers/store-collections.controller";

const router = Router();

// Public collections (no auth)
router.get("/store-collections/public", publicListController);

// Authenticated routes - RBAC applied

// List collections (viewer+)
router.get("/store-collections", authenticate, requirePermission("collections:read"), merchantListController);

// Create collection (manager+)
router.post("/store-collections", authenticate, requirePermission("collections:create"), merchantCreateController);

// Update collection (manager+)
router.patch("/store-collections/:id", authenticate, requirePermission("collections:update"), merchantPatchController);

// Delete collection (admin+)
router.delete("/store-collections/:id", authenticate, requirePermission("collections:delete"), merchantDeleteController);

// Manage collection products (manager+)
router.put("/store-collections/:id/products", authenticate, requirePermission("collections:update"), merchantSetProductsController);
router.get("/store-collections/:id/products", authenticate, requirePermission("collections:read"), merchantGetProductIdsController);

export default router;
