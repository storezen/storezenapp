import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  approveReviewController,
  getPendingReviewsController,
  getProductReviewsController,
  rejectReviewController,
  submitReviewController,
} from "../controllers/reviews.controller";

const router = Router();

// Public routes
router.get("/products/:productId/reviews", getProductReviewsController);
router.post("/products/:productId/reviews", submitReviewController);

// Admin routes
router.get("/reviews/pending", authenticate, getPendingReviewsController);
router.post("/reviews/:id/approve", authenticate, approveReviewController);
router.delete("/reviews/:id", authenticate, rejectReviewController);

export default router;