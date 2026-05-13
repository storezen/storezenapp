"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
};

type RatingStats = {
  count: number;
  average: number;
  distribution: Record<number, number>;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/products/${productId}/reviews`)
      .then((r: unknown) => {
        const data = r as { reviews?: Review[]; stats?: RatingStats };
        setReviews(data.reviews ?? []);
        setStats(data.stats ?? null);
      })
      .catch(() => {
        setReviews([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100" />
        ))}
      </div>
    );
  }

  if (!stats || stats.count === 0) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-6 text-center">
        <Star className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-sm font-medium text-zinc-600">No reviews yet</p>
        <p className="mt-1 text-xs text-zinc-400">Be the first to review this product</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-1 md:justify-start">
            <span className="text-4xl font-bold text-zinc-900">{stats.average}</span>
            <span className="text-lg text-zinc-500">/5</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-0.5 md:justify-start">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= Math.round(stats.average) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{stats.count} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-1.5 md:w-48">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] ?? 0;
            const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-zinc-500">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-zinc-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="rounded-xl border border-zinc-100 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-zinc-900">{review.customerName}</p>
                <div className="mt-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p className="mt-3 text-sm text-zinc-600">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {reviews.length > 5 && (
        <button className="w-full py-2 text-center text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Show all {reviews.length} reviews
        </button>
      )}
    </div>
  );
}

// Review Form Component
export function ReviewForm({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || rating < 1 || rating > 5) return;

    setSubmitting(true);
    setMessage("");

    try {
      await apiFetch(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ customerName: name, rating, comment }),
      });
      setMessage("Review submitted! It will be visible after approval.");
      setName("");
      setRating(5);
      setComment("");
      onSuccess?.();
    } catch {
      setMessage("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-100 bg-white p-4">
      <h3 className="font-semibold text-zinc-900">Write a Review</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-md border border-zinc-300 px-4 text-sm"
          placeholder="John Doe"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700">Rating</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-7 w-7",
                  star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-zinc-500">{rating}/5</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700">Your Review (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] w-full rounded-md border border-zinc-300 px-4 py-3 text-sm"
          placeholder="Share your experience with this product..."
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes("submitted") ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}