import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  createBundleController,
  listBundlesController,
  getBundleController,
  getFrequentlyBoughtTogetherController,
} from "../controllers/bundles.controller";

const router = Router();

router.use(authenticate);

router.get("/bundles/frequently-bought", getFrequentlyBoughtTogetherController);
router.get("/bundles", listBundlesController);
router.get("/bundles/:id", getBundleController);
router.post("/bundles", createBundleController);

export default router;
