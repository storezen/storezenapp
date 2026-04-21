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
  toggleProductController,
  updateProductController,
} from "../controllers/products.controller";

const router = Router();

router.get("/products/public", getPublicProductsController);
router.get("/products/public/:slug", getPublicProductBySlugController);
router.get("/products", authenticate, getStoreProductsController);
router.post("/products", authenticate, createProductController);
router.put("/products/:id", authenticate, updateProductController);
router.delete("/products/:id", authenticate, deleteProductController);
router.put("/products/:id/toggle", authenticate, toggleProductController);
router.get("/products/export", authenticate, exportProductsController);
router.get("/products/template", authenticate, productsTemplateController);
router.post("/products/import", authenticate, importProductsController);

export default router;
