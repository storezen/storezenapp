import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  bulkStatusController,
  exportOrdersController,
  getCustomersAggregateController,
  getCustomersExportController,
  getOrderByIdController,
  getOrderEventsController,
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
router.get("/orders/customers/aggregate", authenticate, getCustomersAggregateController);
router.get("/orders/customers/export", authenticate, getCustomersExportController);
router.get("/orders/:id", authenticate, getOrderByIdController);
router.get("/orders/:id/events", authenticate, getOrderEventsController);
router.put("/orders/:id/status", authenticate, updateOrderStatusController);
router.post("/orders/bulk-status", authenticate, bulkStatusController);

export default router;

