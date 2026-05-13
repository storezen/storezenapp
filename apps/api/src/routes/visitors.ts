import { Router } from "express";
import { getStoreVisitorStats, trackVisitor } from "../lib/visitors";

const router = Router();

// Track visitor (called from store frontend)
router.post("/track", (req, res): void => {
  const { storeId, sessionId, page } = req.body;
  if (!storeId || !sessionId) {
    res.status(400).json({ error: "Missing storeId or sessionId" });
    return;
  }
  trackVisitor(storeId, sessionId, page);
  res.json({ ok: true });
});

// Get live visitor count (called from admin dashboard)
router.get("/:storeId", (req, res): void => {
  const { storeId } = req.params;
  if (!storeId) {
    res.status(400).json({ error: "Missing storeId" });
    return;
  }
  const stats = getStoreVisitorStats(storeId);
  res.json(stats);
});

export default router;