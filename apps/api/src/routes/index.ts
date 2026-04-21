import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import collectionsRouter from "./collections.js";
import productsRouter from "./products.js";
import authRouter from "./auth.js";
import ordersRouter from "./orders.js";
import storesRouter from "./stores.js";
import couponsRouter from "./coupons.js";
import adminRouter from "./admin.js";
import webhooksRouter from "./webhooks.js";
import shippingRouter from "./shipping.js";
import influencersRouter from "./influencers.js";
import refRouter from "./ref.js";
import aiRouter from "./ai.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(collectionsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(storesRouter);
router.use(couponsRouter);
router.use(adminRouter);
router.use(webhooksRouter);
router.use(shippingRouter);
router.use(influencersRouter);
router.use(refRouter);
router.use(aiRouter);

export default router;
