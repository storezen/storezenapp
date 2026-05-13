import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  getAdminStatsController,
  getPlatformSettingsController,
  listStoresController,
  listUsersController,
  listAllProductsController,
  toggleStoreController,
  toggleUserBanController,
  updatePlatformSettingsController,
  updateStorePlanController,
  updateUserPlanController,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticate);

router.get("/admin/stats", getAdminStatsController);
router.get("/admin/stores", listStoresController);
router.put("/admin/stores/:id/toggle", toggleStoreController);
router.put("/admin/stores/:id/plan", updateStorePlanController);
router.get("/admin/users", listUsersController);
router.put("/admin/users/:id/ban", toggleUserBanController);
router.put("/admin/users/:id/plan", updateUserPlanController);
router.get("/admin/products", listAllProductsController);
router.get("/admin/settings", getPlatformSettingsController);
router.put("/admin/settings", updatePlatformSettingsController);

export default router;

