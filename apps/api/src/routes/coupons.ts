import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  createCouponController,
  deleteCouponController,
  listCouponsController,
  updateCouponController,
  validateCouponController,
} from "../controllers/coupons.controller";

const router = Router();

router.post("/coupons", authenticate, createCouponController);
router.get("/coupons", authenticate, listCouponsController);
router.put("/coupons/:id", authenticate, updateCouponController);
router.delete("/coupons/:id", authenticate, deleteCouponController);

router.get("/coupons/validate", validateCouponController);

export default router;

