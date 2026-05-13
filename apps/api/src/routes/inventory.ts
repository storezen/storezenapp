import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { getInventoryHistoryController, logInventoryChangeController } from "../controllers/inventory.controller";

const router = Router();

router.use(authenticate);

router.get("/products/:productId/inventory-history", getInventoryHistoryController);
router.post("/products/:productId/inventory-history", logInventoryChangeController);

export default router;
