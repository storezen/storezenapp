import { Router, type IRouter } from "express";
import { apiLimiter, authLimiter } from "../middlewares/rateLimit.js";
import { authenticate } from "../middlewares/authenticate.js";
import { resolveTenant } from "../middlewares/tenant.js";
import { requirePermission, requireAdmin } from "../middlewares/rbac.js";

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

router.use(apiLimiter);

// ============================================
// PUBLIC ROUTES - No auth required
// ============================================
router.get("/stores/:slug", getStoreBySlugController);
router.get("/products/public", getPublicProductsController);
router.post("/orders", (req: any, res: any, next: any) => {
  if (!req.tenant) return res.status(400).json({ error: "TENANT_REQUIRED" });
  placeOrderController(req, res, next);
});

router.use(healthRouter);

// Auth routes (with rate limit)
router.use("/auth", authLimiter, authRouter);

// ============================================
// TENANT ROUTES - Require store context
// ============================================
router.use(resolveTenant);

// All tenant routes require authentication
router.use(authenticate);

// Store management
router.get("/stores", requirePermission("store:read"));
router.put("/stores", requirePermission("store:update"));

// Products, Collections, Orders, Coupons
router.use("/products", productsRouter);
router.use("/collections", storeCollectionsRouter);
router.use("/orders", ordersRouter);
router.use("/coupons", couponsRouter);

// Admin routes
router.use("/admin", requireAdmin, adminRouter);

// Other routes
router.use(storeBundlesRouter);
router.use(bundlesRouter);
router.use(bundlesStoreRouter);
router.use(cartsRouter);
router.use(couponsRouter);
router.use(webhooksRouter);
router.use(shippingRouter);
router.use(influencersRouter);
router.use(refRouter);
router.use(aiRouter);
router.use(reviewsRouter);
router.use(adminStoreRouter);
router.use(inventoryStoreRouter);

router.use(cmsRouter);
router.use("/:storeSlug/cms", storeCmsRouter);
router.use("/visitors", visitorsRouter);
router.use("/events", eventsRouter);

export default router;
