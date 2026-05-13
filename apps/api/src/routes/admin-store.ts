import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  getLowStockController,
  getOutOfStockController,
  getTopStockController,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticate);

router.get("/products/low-stock", getLowStockController);
router.get("/products/out-of-stock", getOutOfStockController);
router.get("/products/top-stock", getTopStockController);

export default router;
