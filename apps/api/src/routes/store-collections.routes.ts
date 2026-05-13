import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
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

router.get("/store-collections/public", publicListController);

router.get("/store-collections", authenticate, merchantListController);
router.post("/store-collections", authenticate, merchantCreateController);
router.patch("/store-collections/:id", authenticate, merchantPatchController);
router.delete("/store-collections/:id", authenticate, merchantDeleteController);
router.put("/store-collections/:id/products", authenticate, merchantSetProductsController);
router.get("/store-collections/:id/products", authenticate, merchantGetProductIdsController);

export default router;
