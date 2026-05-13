import { Router } from "express";
import { abandonCartController, listAbandonedCartsController, recoverAbandonedCartController } from "../controllers/abandoned-carts.controller";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/carts/abandon", abandonCartController);
router.get("/carts/abandoned", authenticate, listAbandonedCartsController);
router.post("/carts/abandoned/:id/recover", authenticate, recoverAbandonedCartController);

export default router;
