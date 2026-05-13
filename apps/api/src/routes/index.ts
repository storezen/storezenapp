import { Router, type IRouter } from "express";
import { storeFromHostMiddleware } from "../middlewares/storeFromHost";
import healthRouter from "./health.js";
import bundlesRouter from "./bundles.routes.js";
import storeBundlesRouter from "./store-bundles.routes.js";
import cartsRouter from "./carts.routes.js";
import storeCollectionsRouter from "./store-collections.routes.js";
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
import reviewsRouter from "./reviews.routes.js";
import adminStoreRouter from "./admin-store.js";
import inventoryStoreRouter from "./inventory-store.js";
import bundlesStoreRouter from "./bundles-store.routes.js";
import cmsRouter from "./cms.js";
import storeCmsRouter from "./store-cms.routes.js";
import visitorsRouter from "./visitors.js";
import eventsRouter from "./events.js";
import { getStoreBySlugController } from "../controllers/stores.controller";
import { getPublicProductsController } from "../controllers/products.controller";
import { placeOrderController } from "../controllers/orders.controller";

const router: IRouter = Router();

router.use(storeFromHostMiddleware);

// Public routes - no authentication required
router.get("/stores/:slug", getStoreBySlugController);
router.get("/products/public", getPublicProductsController);
router.post("/orders", placeOrderController);

router.use(healthRouter);
router.use(authRouter);
router.use(storeCollectionsRouter);
router.use(bundlesRouter);
router.use(storeBundlesRouter);
router.use(cartsRouter);
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
router.use(reviewsRouter);
router.use(adminStoreRouter);
router.use(inventoryStoreRouter);
router.use(bundlesStoreRouter);

router.use(cmsRouter);
router.use("/:storeSlug/cms", storeCmsRouter);
router.use("/visitors", visitorsRouter);
router.use("/events", eventsRouter);

export default router;