import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  addItemToBundleController,
  createBundleController,
  deleteBundleController,
  getBundleController,
  listBundlesController,
  removeItemFromBundleController,
  updateBundleController,
  updateBundleItemController,
} from "../controllers/bundles.controller";

const router = Router();

router.use(authenticate);

router.get("/bundles", listBundlesController);
router.get("/bundles/:id", getBundleController);
router.post("/bundles", createBundleController);
router.put("/bundles/:id", updateBundleController);
router.delete("/bundles/:id", deleteBundleController);
router.post("/bundles/:id/items", addItemToBundleController);
router.delete("/bundles/:id/items/:itemId", removeItemFromBundleController);
router.put("/bundles/:id/items/:itemId", updateBundleItemController);

export default router;