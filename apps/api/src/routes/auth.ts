import { Router } from "express";
import {
  adminLoginController,
  changePasswordController,
  forgotPasswordController,
  loginController,
  meController,
  refreshController,
  registerController,
  resetPasswordController,
  updateProfileController,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/auth/register", registerController);
router.post("/auth/login", loginController);
router.post("/auth/admin/login", adminLoginController);
router.post("/auth/refresh", refreshController);
router.post("/auth/password/forgot", forgotPasswordController);
router.post("/auth/password/reset", resetPasswordController);
router.get("/auth/me", authenticate, meController);
router.put("/auth/profile", authenticate, updateProfileController);
router.put("/auth/password/change", authenticate, changePasswordController);

export default router;

