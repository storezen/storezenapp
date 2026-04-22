import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  discount?: number;
  isLowStock?: boolean;
}

export function ProductImageGallery({ images, productName, discount, isLowStock }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Touch/swipe state for main image
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Pinch-to-zoom state
  const pinchStartDist = useRef<number | null>(null);
  const pinchScale = useRef(1);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLImageElement>(null);

  const switchImage = useCallback((index: number) => {
    if (index === activeIndex) return;
    setFading(true);
    setTimeout(() => {
      setActiveIndex(index);
      setZoomScale(1);
      setFading(false);
    }, 180);
  }, [activeIndex]);

  const prev = useCallback(() => switchImage((activeIndex - 1 + images.length) % images.length), [activeIndex, images.length, switchImage]);
  const next = useCallback(() => switchImage((activeIndex + 1) % images.length), [activeIndex, images.length, switchImage]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, images.length]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  // Swipe handlers for main image
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchScale.current = zoomScale;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      const newScale = Math.min(4, Math.max(1, pinchScale.current * ratio));
      setZoomScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinchStartDist.current !== null) {
      pinchStartDist.current = null;
      if (zoomScale <= 1.05) setZoomScale(1);
      return;
    }
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current ?? 0));
    if (Math.abs(dx) > 50 && dy < 60) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const openLightbox = () => {
    if (zoomScale > 1.1) return;
    setLightboxIndex(activeIndex);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="w-full select-none">
        {/* Main Image */}
        <div
          className="relative bg-muted md:rounded-2xl overflow-hidden cursor-zoom-in"
          style={{ maxHeight: 480 }}
          onClick={openLightbox}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="aspect-square md:aspect-[4/3] w-full overflow-hidden flex items-center justify-center">
            <img
              ref={imgRef}
              src={images[activeIndex]}
              alt={`${productName} - image ${activeIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
              style={{
                opacity: fading ? 0 : 1,
                transform: `scale(${zoomScale})`,
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                touchAction: zoomScale > 1 ? 'none' : 'pan-y',
                transition: fading ? 'opacity 0.18s ease' : 'opacity 0.18s ease, transform 0.1s ease',
              }}
              draggable={false}
            />
          </div>

          {/* Badges */}
          {discount && discount > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg font-black text-sm tracking-wider uppercase shadow-lg -rotate-2">
              Sale {discount}% Off
            </div>
          )}
          {isLowStock && (
            <div className="absolute top-4 right-4 z-10 bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide animate-pulse">
              Low Stock
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom icon hint */}
          <div className="absolute bottom-3 left-3 z-10 bg-black/40 text-white/80 p-1.5 rounded-full backdrop-blur-sm opacity-70 hover:opacity-100 transition-opacity">
            <ZoomIn size={14} />
          </div>

          {/* Desktop prev/next arrows */}
          {images.length > 1 && (
            <>
              <button
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-background/80 backdrop-blur-sm border border-border rounded-full items-center justify-center hover:bg-background transition-colors shadow-sm"
                onClick={e => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-background/80 backdrop-blur-sm border border-border rounded-full items-center justify-center hover:bg-background transition-colors shadow-sm"
                onClick={e => { e.stopPropagation(); next(); }}
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar px-0 pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => switchImage(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  i === activeIndex
                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                    : 'border-border hover:border-primary/50 opacity-60 hover:opacity-100'
                }`}
                aria-label={`View image ${i + 1}`}
                data-testid={`thumbnail-${i}`}
              >
                <img
                  src={src}
                  alt={`${productName} thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* Mobile swipe indicator dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => switchImage(i)}
                className={`rounded-full transition-all ${
                  i === activeIndex ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-bold">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Prev Arrow */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex]}
            alt={`${productName} - image ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ transition: 'opacity 0.2s ease' }}
          />

          {/* Next Arrow */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Lightbox thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? 'border-white scale-110' : 'border-white/30 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
