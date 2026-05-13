import { and, eq, desc } from "drizzle-orm";
import { db, reviewsTable } from "../db";

export async function findReviewsByProductId(productId: string, approvedOnly = true) {
  return db
    .select()
    .from(reviewsTable)
    .where(
      approvedOnly
        ? and(eq(reviewsTable.productId, productId), eq(reviewsTable.isApproved, true))
        : eq(reviewsTable.productId, productId)
    )
    .orderBy(desc(reviewsTable.createdAt));
}

export async function findReviewById(id: string) {
  const [review] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id))
    .limit(1);
  return review ?? null;
}

export async function createReview(data: {
  storeId: string;
  productId: string;
  customerName: string;
  rating: number;
  comment?: string;
  images?: string[];
  isApproved?: boolean;
}) {
  const [review] = await db
    .insert(reviewsTable)
    .values({
      id: crypto.randomUUID(),
      storeId: data.storeId,
      productId: data.productId,
      customerName: data.customerName,
      rating: data.rating,
      comment: data.comment,
      images: data.images ?? [],
      isApproved: data.isApproved ?? false,
    })
    .returning();
  return review;
}

export async function updateReview(id: string, data: {
  rating?: number;
  comment?: string;
  images?: string[];
  isApproved?: boolean;
}) {
  const [review] = await db
    .update(reviewsTable)
    .set(data)
    .where(eq(reviewsTable.id, id))
    .returning();
  return review;
}

export async function deleteReview(id: string) {
  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
}

export async function getProductRatingStats(productId: string) {
  const reviews = await db
    .select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.isApproved, true)));

  if (reviews.length === 0) {
    return { count: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = total / reviews.length;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating as keyof typeof distribution]++;
    }
  });

  return {
    count: reviews.length,
    average: Math.round(average * 10) / 10,
    distribution,
  };
}