import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requirePermission } from "../middlewares/rbac";
import {
  getOrdersController,
  getOrderController,
  updateOrderController,
  deleteOrderController,
  createOrderController,
} from "../controllers/orders.controller";

const router = Router();

// All routes require tenant + auth (handled by parent router)

// List orders (viewer+)
router.get("/", authenticate, requirePermission("orders:read"), getOrdersController);

// Get single order (viewer+)
router.get("/:id", authenticate, requirePermission("orders:read"), getOrderController);

// Create order (manager+)
router.post("/", authenticate, requirePermission("orders:create"), createOrderController);

// Update order (manager+)
router.put("/:id", authenticate, requirePermission("orders:update"), updateOrderController);

// Delete order (admin+)
router.delete("/:id", authenticate, requirePermission("orders:delete"), deleteOrderController);

export default router;
