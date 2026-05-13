import { Router, type Request, type Response } from "express";
import { authenticate } from "../middlewares/authenticate";
import { trackEvent, getIntentCounts, getLiveVisitorsByStore, getTrendingProducts, getActivityFeed, type EventType } from "../services/eventService";

const router = Router();

// Track an event (called from frontend)
router.post("/", (req: Request, res: Response): void => {
  const { storeId, sessionId, eventType, productId, orderId, amount, metadata } = req.body;

  if (!storeId || !sessionId || !eventType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const validEvents: EventType[] = ["page_view", "product_view", "add_to_cart", "begin_checkout", "purchase", "search", "wishlist"];
  if (!validEvents.includes(eventType)) {
    res.status(400).json({ error: "Invalid event type" });
    return;
  }

  trackEvent({
    storeId,
    sessionId,
    eventType,
    productId,
    orderId,
    amount,
    metadata,
    timestamp: Date.now(),
  });

  res.json({ ok: true });
});

// Get activity feed
router.get("/activity", authenticate, (req: Request, res: Response): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Get storeId from user - in production, get from user's store
  const storeId = (req.query.storeId as string) || "default";
  const limit = parseInt(req.query.limit as string) || 20;

  const feed = getActivityFeed(storeId, limit);
  res.json({ activities: feed });
});

// Get intent counts
router.get("/intent", authenticate, (req: Request, res: Response): void => {
  const storeId = (req.query.storeId as string) || "default";
  const hours = parseInt(req.query.hours as string) || 1;
  const counts = getIntentCounts(storeId, hours);
  res.json(counts);
});

// Get live visitors
router.get("/visitors", authenticate, (req: Request, res: Response): void => {
  const storeId = (req.query.storeId as string) || "default";
  const visitors = getLiveVisitorsByStore(storeId);
  res.json(visitors);
});

// Get trending products
router.get("/trending", authenticate, (req: Request, res: Response): void => {
  const storeId = (req.query.storeId as string) || "default";
  const hours = parseInt(req.query.hours as string) || 1;
  const trending = getTrendingProducts(storeId, hours);
  res.json({ trending });
});

export default router;