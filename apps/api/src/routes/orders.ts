import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  bulkStatusController,
  exportOrdersController,
  getOrderByIdController,
  getOrdersController,
  placeOrderController,
  trackOrderController,
  updateOrderStatusController,
} from "../controllers/orders.controller";

const router = Router();

router.post("/orders", placeOrderController);
router.get("/orders/track", trackOrderController);
router.get("/orders/export", authenticate, exportOrdersController);
router.get("/orders", authenticate, getOrdersController);
router.get("/orders/:id", authenticate, getOrderByIdController);
router.put("/orders/:id/status", authenticate, updateOrderStatusController);
router.post("/orders/bulk-status", authenticate, bulkStatusController);

export default router;

