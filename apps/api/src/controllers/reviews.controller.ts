import { type Request, type Response } from "express";
import {
  approveReview,
  findReviewsByProductId,
  getProductRatingStats,
  getPendingReviews,
  rejectReview,
  submitReview,
} from "../services/reviews.service";

export async function getProductReviewsController(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;

    const [stats, reviews] = await Promise.all([
      getProductRatingStats(productId),
      findReviewsByProductId(productId, true),
    ]);

    return res.json({
      stats,
      reviews: reviews.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        images: r.images,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get reviews";
    return res.status(500).json({ error: msg });
  }
}

export async function submitReviewController(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const { customerName, rating, comment, images, storeSlug } = req.body;

    if (!customerName || !rating) {
      return res.status(400).json({ error: "Customer name and rating are required" });
    }

    // Get storeId from product if not provided
    let storeId = req.body.storeId || req.user?.storeId;
    if (!storeId && storeSlug) {
      const { findStoreBySlug } = await import("../repositories/products.repository.js");
      const store = await findStoreBySlug(storeSlug);
      storeId = store?.id;
    }
    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const review = await submitReview({
      storeId,
      productId,
      customerName,
      rating,
      comment,
      images,
    });

    return res.status(201).json({
      review,
      message: "Review submitted successfully. It will be visible after approval.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit review";
    return res.status(500).json({ error: msg });
  }
}

export async function getPendingReviewsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });

    const reviews = await getPendingReviews(req.user.storeId);
    return res.json({ reviews });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get pending reviews";
    return res.status(500).json({ error: msg });
  }
}

export async function approveReviewController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    const review = await approveReview(id);
    return res.json({ review });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to approve review";
    if (msg === "Review not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function rejectReviewController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    await rejectReview(id);
    return res.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reject review";
    if (msg === "Review not found") return res.status(404).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}