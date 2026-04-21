import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  getMyStoreController,
  getStoreBySlugController,
  getStoreStatsController,
  updateMyStoreController,
  updateStoreDeliveryController,
  updateStorePagesController,
  updateStorePaymentController,
  updateStorePixelController,
  updateStoreThemeController,
} from "../controllers/stores.controller";

const router = Router();

router.get("/stores/my", authenticate, getMyStoreController);
router.put("/stores/my", authenticate, updateMyStoreController);
router.put("/stores/my/theme", authenticate, updateStoreThemeController);
router.put("/stores/my/pixel", authenticate, updateStorePixelController);
router.put("/stores/my/delivery", authenticate, updateStoreDeliveryController);
router.put("/stores/my/payment", authenticate, updateStorePaymentController);
router.put("/stores/my/pages", authenticate, updateStorePagesController);
router.get("/stores/my/stats", authenticate, getStoreStatsController);

router.get("/stores/:slug", getStoreBySlugController);

export default router;

