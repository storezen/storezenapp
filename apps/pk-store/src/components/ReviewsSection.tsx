import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, X, Star, Camera, ChevronDown, Pen } from 'lucide-react';
import { getProductReviews, type Review } from '../data/reviews';
import { STORE_CONFIG } from '../config';

const PAGE_SIZE = 3;

/* ─── Star components ──────────────────────────────────────────────────────── */
function StarRow({
  rating,
  size = 14,
  className = '',
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={i <= rating ? 'text-amber-400' : 'text-muted-foreground/25'}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Photo Lightbox ────────────────────────────────────────────────────────── */
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-2"
        aria-label="Close photo"
      >
        <X size={20} />
      </button>
      <motion.img
        src={src}
        alt="Review photo"
        className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
      />
    </motion.div>
  );
}

/* ─── Star Selector (Write a Review) ───────────────────────────────────────── */
function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
        >
          <Star
            size={28}
            fill={i <= active ? '#f59e0b' : 'none'}
            stroke={i <= active ? '#f59e0b' : '#6b7280'}
            className="transition-colors"
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Write a Review form ───────────────────────────────────────────────────── */
function WriteReviewForm({
  productId,
  productName,
  onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }
    if (name.trim().length < 2) { setError('Please enter your name.'); return; }
    if (text.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }
    setError('');

    const stars = '⭐'.repeat(rating);
    const msg = encodeURIComponent(
      `🌟 *Product Review — ${productName}*\n\n` +
      `👤 Name: ${name.trim()}\n` +
      `${stars} Rating: ${rating}/5\n\n` +
      `📝 Review:\n${text.trim()}\n\n` +
      `_Submitted via Zorvik website_`
    );
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
    setSubmitted(true);
  };

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-6 mt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-lg">Write a Review</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {submitted ? (
        <motion.div
          className="flex flex-col items-center gap-3 py-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-3xl">✅</div>
          <p className="font-black text-lg">Thank you!</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your review has been sent to WhatsApp. It will appear on the site after verification.
          </p>
          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold"
          >
            Done
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-bold mb-2">Your Rating *</label>
            <StarSelector value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-amber-500 font-medium mt-1">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-1.5" htmlFor="review-name">
              Your Name *
            </label>
            <input
              id="review-name"
              type="text"
              placeholder="e.g. Ahmed"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              maxLength={60}
            />
          </div>

          {/* Review text */}
          <div>
            <label className="block text-sm font-bold mb-1.5" htmlFor="review-text">
              Review *
              <span className="text-muted-foreground font-normal ml-1">(min 10 characters)</span>
            </label>
            <textarea
              id="review-text"
              placeholder="Share your experience with this product..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              maxLength={1000}
            />
            <div className="text-right text-xs text-muted-foreground mt-0.5">{text.length}/1000</div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Camera size={12} />
            <span>Review will be submitted via WhatsApp for verification before publishing.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors"
          >
            Submit Review via WhatsApp
          </button>
        </form>
      )}
    </motion.div>
  );
}

/* ─── Individual review card ───────────────────────────────────────────────── */
function ReviewCard({ review, onPhotoClick }: { review: Review; onPhotoClick?: (src: string) => void }) {
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const initials = review.reviewer_name.split(' ').map(s => s[0]).join('').toUpperCase();

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm flex-shrink-0 select-none">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{review.reviewer_name}</span>
              {review.verified_purchase && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-bold px-1.5 py-0.5 rounded-full">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified Purchase
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{review.city} · {review.date}</span>
          </div>
        </div>
        <StarRow rating={review.rating} size={13} />
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground/80 leading-relaxed">{review.review_text}</p>

      {/* Review photo */}
      {review.review_image && (
        <button
          onClick={() => onPhotoClick?.(review.review_image!)}
          className="mt-3 relative overflow-hidden rounded-lg w-24 h-24 block group ring-2 ring-transparent hover:ring-primary transition-all"
          aria-label="View review photo"
          data-testid="btn-review-photo"
        >
          <img
            src={review.review_image}
            alt="Customer photo"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={16} className="text-white" />
          </div>
        </button>
      )}

      {/* Helpful */}
      <button
        onClick={() => setHelpfulClicked(prev => !prev)}
        className={`flex items-center gap-1.5 text-xs mt-3 transition-colors ${helpfulClicked ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <ThumbsUp size={11} />
        Helpful ({review.helpful + (helpfulClicked ? 1 : 0)})
      </button>
    </motion.div>
  );
}

/* ─── Main ReviewsSection ──────────────────────────────────────────────────── */
interface ReviewsSectionProps {
  productId: string;
  productName?: string;
}

export function ReviewsSection({ productId, productName = 'this product' }: ReviewsSectionProps) {
  const reviews = getProductReviews(productId);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const avgDisplay = avgRating.toFixed(1);
  const shownReviews = reviews.slice(0, visible);
  const hasMore = visible < reviews.length;

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  };

  return (
    <section className="mt-12 border-t border-border pt-10" aria-label="Customer reviews">
      {/* ── Summary header ──── */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-8">
        {/* Big score */}
        <div className="flex flex-col items-center bg-muted/40 rounded-2xl p-6 min-w-[148px] text-center flex-shrink-0">
          <span className="text-6xl font-black text-primary leading-none">{avgDisplay}</span>
          <StarRow rating={Math.round(avgRating)} size={18} className="mt-2 justify-center" />
          <span className="text-xs text-muted-foreground mt-2">{reviews.length} reviews</span>
          <div className="mt-3 text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
            {Math.round((reviews.filter(r => r.rating === 5).length / reviews.length) * 100)}% 5★
          </div>
        </div>

        {/* Distribution + CTA */}
        <div className="flex-1 w-full">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Customer Reviews</h2>
              <p className="text-muted-foreground text-sm">Verified purchases from across Pakistan</p>
            </div>
            <button
              onClick={openForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
              data-testid="btn-write-review"
            >
              <Pen size={14} />
              Write a Review
            </button>
          </div>

          {/* Bar chart */}
          <div className="space-y-1.5 mt-4">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = (count / reviews.length) * 100;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 font-medium text-muted-foreground text-right">{star}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 flex-shrink-0">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-5 text-xs text-muted-foreground text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Review cards ──── */}
      <div className="space-y-4">
        <AnimatePresence>
          {shownReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onPhotoClick={setLightboxSrc}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-colors"
            data-testid="btn-show-more-reviews"
          >
            <ChevronDown size={16} />
            Show More Reviews ({reviews.length - visible} remaining)
          </button>
        </div>
      )}

      {/* Write a Review form */}
      <div ref={formRef}>
        <AnimatePresence>
          {showForm && (
            <WriteReviewForm
              productId={productId}
              productName={productName}
              onClose={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
