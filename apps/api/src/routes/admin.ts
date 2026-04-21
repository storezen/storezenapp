import { Router } from "express";
import { authenticateAdmin } from "../middlewares/authenticateAdmin";
import {
  getAdminStatsController,
  getPlatformSettingsController,
  listStoresController,
  listUsersController,
  toggleStoreController,
  toggleUserBanController,
  updatePlatformSettingsController,
  updateStorePlanController,
  updateUserPlanController,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticateAdmin);

router.get("/admin/stats", getAdminStatsController);
router.get("/admin/stores", listStoresController);
router.put("/admin/stores/:id/toggle", toggleStoreController);
router.put("/admin/stores/:id/plan", updateStorePlanController);
router.get("/admin/users", listUsersController);
router.put("/admin/users/:id/ban", toggleUserBanController);
router.put("/admin/users/:id/plan", updateUserPlanController);
router.get("/admin/settings", getPlatformSettingsController);
router.put("/admin/settings", updatePlatformSettingsController);

export default router;

