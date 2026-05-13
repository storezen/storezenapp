import { and, desc, eq } from "drizzle-orm";
import { db, reviewsTable } from "../db";
import {
  createReview,
  deleteReview,
  findReviewById,
  findReviewsByProductId,
  getProductRatingStats,
  updateReview,
} from "../repositories/reviews.repository";

export { findReviewsByProductId, getProductRatingStats };

export async function submitReview(data: {
  storeId: string;
  productId: string;
  customerName: string;
  rating: number;
  comment?: string;
  images?: string[];
}) {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return createReview({
    ...data,
    isApproved: false, // Reviews require approval
  });
}

export async function approveReview(id: string) {
  const review = await findReviewById(id);
  if (!review) throw new Error("Review not found");

  return updateReview(id, { isApproved: true });
}

export async function rejectReview(id: string) {
  const review = await findReviewById(id);
  if (!review) throw new Error("Review not found");

  await deleteReview(id);
  return { ok: true };
}

export async function getPendingReviews(storeId: string) {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(and(eq(reviewsTable.storeId, storeId), eq(reviewsTable.isApproved, false)))
    .orderBy(desc(reviewsTable.createdAt));

  return reviews;
}

export async function getAllProductReviews(productId: string, includeUnapproved = false) {
  return findReviewsByProductId(productId, !includeUnapproved);
}