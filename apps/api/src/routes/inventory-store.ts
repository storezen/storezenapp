import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  bulkUpdateProductsController,
  reorderProductsController,
  reserveStockController,
  confirmReservationController,
  getActiveReservationsController,
} from "../controllers/inventory.controller";

const router = Router();

router.use(authenticate);

router.patch("/products/bulk-update", bulkUpdateProductsController);
router.patch("/products/reorder", reorderProductsController);
router.post("/products/:productId/reserve", reserveStockController);
router.post("/reservations/:id/confirm", confirmReservationController);
router.get("/reservations", getActiveReservationsController);

export default router;
