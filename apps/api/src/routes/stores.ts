import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  createMyCampaignController,
  deleteMyCampaignController,
  getMyCampaignsController,
  getMyStoreAnalyticsController,
  getMyStoreController,
  getMyStorePagesController,
  getStoreStatsController,
  patchMyCampaignController,
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
router.get("/stores/my/pages", authenticate, getMyStorePagesController);
router.put("/stores/my/pages", authenticate, updateStorePagesController);
router.get("/stores/my/stats", authenticate, getStoreStatsController);
router.get("/stores/my/analytics", authenticate, getMyStoreAnalyticsController);
router.get("/stores/my/campaigns", authenticate, getMyCampaignsController);
router.post("/stores/my/campaigns", authenticate, createMyCampaignController);
router.patch("/stores/my/campaigns/:id", authenticate, patchMyCampaignController);
router.delete("/stores/my/campaigns/:id", authenticate, deleteMyCampaignController);

export default router;

