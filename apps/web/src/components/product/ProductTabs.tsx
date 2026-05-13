"use client";

import { useState } from "react";
import { ChevronDown, Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api";
import type { ProductReview, RatingStats } from "@/types";
import { Button } from "@/components/ui/button";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

type Tab = "description" | "specs" | "reviews" | "faq";

const tabs: { id: Tab; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
];

const faqItems = [
  { q: "How long does delivery take?", a: "We deliver within 2–5 business days across Pakistan. Major cities usually get it in 2–3 days." },
  { q: "Is COD available?", a: "Yes! Cash on Delivery is available in all major cities. You can also open the parcel before payment in many areas." },
  { q: "What is your return policy?", a: "We offer a 7-day return policy for unused items in original packaging. Contact us via WhatsApp to initiate a return." },
  { q: "Are these products genuine?", a: "Yes, all our products are 100% authentic. We source directly from authorized distributors." },
  { q: "Can I track my order?", a: "Yes! Once your order ships, you'll receive a tracking number via SMS. You can also track it on our website." },
];

type Props = {
  description: string;
  specs?: Record<string, string>;
  reviews?: ProductReview[];
  reviewStats?: RatingStats | null;
  productId: string;
};

export function ProductTabs({ description, specs, reviews, reviewStats, productId }: Props) {
  const [active, setActive] = useState<Tab>("description");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              active === t.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700",
            )}
          >
            {t.label}
            {t.id === "reviews" && reviewStats ? (
              <span className="ml-1.5 text-xs font-medium text-zinc-400">({reviewStats.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Description */}
      {active === "description" && (
        <div className="rounded-xl border border-zinc-100 bg-white p-5">
          <div
            className="prose prose-sm max-w-none text-zinc-600"
            dangerouslySetInnerHTML={{ __html: description || "No description available for this product." }}
          />
        </div>
      )}

      {/* Specs */}
      {active === "specs" && (
        <div className="rounded-xl border border-zinc-100 bg-white">
          {specs && Object.keys(specs).length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(specs).map(([key, val], i) => (
                  <tr key={key} className={cn("border-b border-zinc-100 last:border-0", i % 2 === 0 ? "bg-zinc-50/50" : "bg-white")}>
                    <td className="px-4 py-2.5 font-medium text-zinc-700">{key}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-5 text-sm text-zinc-500">No specifications available.</p>
          )}
        </div>
      )}

      {/* Reviews */}
      {active === "reviews" && (
        <div className="space-y-4">
          {/* Summary */}
          {reviewStats && reviewStats.count > 0 ? (
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <div className="flex items-baseline justify-center gap-1 sm:justify-start">
                  <span className="text-4xl font-extrabold text-zinc-900">{reviewStats.average}</span>
                  <span className="text-lg text-zinc-400">/5</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-0.5 sm:justify-start">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3.5 w-3.5",
                        s <= Math.round(reviewStats.average) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200",
                      )}
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-500">{reviewStats.count} verified reviews</p>
              </div>
              <div className="space-y-1 sm:w-48">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewStats.distribution[star] ?? 0;
                  const pct = reviewStats.count > 0 ? (count / reviewStats.count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="w-2 shrink-0">{star}</span>
                      <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" strokeWidth={0} />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-5 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* List */}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-zinc-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 shrink-0 rounded-full bg-zinc-100 text-center text-[10px] font-bold leading-7 text-zinc-500 uppercase">
                          {r.customerName[0]}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900">{r.customerName}</p>
                          {r.verified && (
                            <span className="text-[10px] font-medium text-emerald-600">Verified purchase</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3 w-3",
                              s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200",
                            )}
                            strokeWidth={0}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{r.comment}</p>
                  )}
                  {r.images && r.images.length > 0 && (
                    <div className="mt-2.5 flex gap-2">
                      {r.images.map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img} alt="" className="h-12 w-12 rounded-lg border border-zinc-100 object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
              <Star className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm font-medium text-zinc-600">No reviews yet</p>
              <p className="mt-1 text-xs text-zinc-400">Be the first to review this product</p>
            </div>
          )}

          {/* Submit review form */}
          <ReviewForm productId={productId} />
        </div>
      )}

      {/* FAQ */}
      {active === "faq" && (
        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <div key={i} className="rounded-xl border border-zinc-100 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-[13px] font-semibold text-zinc-900">{item.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
                    openFaq === i && "rotate-180",
                  )}
                  strokeWidth={2}
                />
              </button>
              {openFaq === i && (
                <div className="border-t border-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating"); return; }
    if (!name.trim()) { setError("Please enter your name"); return; }
    setSubmitting(true);
    setError("");
    try {
      await authFetch(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, customerName: name.trim(), comment: comment.trim(), storeSlug: STORE_SLUG }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" strokeWidth={0} />
        </div>
        <p className="mt-2 text-sm font-semibold text-emerald-700">Thank you for your review!</p>
        <p className="mt-1 text-xs text-emerald-600">Your feedback helps other shoppers make better choices.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-zinc-900">Write a review</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  s <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-100 text-zinc-200",
                )}
                strokeWidth={0}
              />
            </button>
          ))}
          <span className="ml-2 text-xs text-zinc-400">{rating > 0 ? `${rating}/5` : "Tap to rate"}</span>
        </div>

        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product…"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-zinc-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <p className="mt-1 text-right text-[10px] text-zinc-400">{comment.length}/1000</p>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          type="submit"
          size="dense"
          className="gap-1.5"
          disabled={submitting}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
      </form>
    </div>
  );
}