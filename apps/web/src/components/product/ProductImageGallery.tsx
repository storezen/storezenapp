"use client";

import { useState, useCallback, useRef, TouchEvent, MouseEvent } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
  className?: string;
};

export function ProductImageGallery({ images, alt, className }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  const imgs = images.length > 0 ? images : ["https://placehold.co/800x800?text=Product"];

  const prev = useCallback(() => {
    setActive((a) => (a === 0 ? imgs.length - 1 : a - 1));
  }, [imgs.length]);

  const next = useCallback(() => {
    setActive((a) => (a === imgs.length - 1 ? 0 : a + 1));
  }, [imgs.length]);

  // Touch swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const initialPinchDist = useRef<number | null>(null);

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      // Only navigate if horizontal swipe is dominant
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        e.preventDefault();
      }
    }
    if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = Math.max(1, Math.min(dist / initialPinchDist.current, 3));
      setPinchScale(scale);
      setIsZooming(scale > 1.1);
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    initialPinchDist.current = null;
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 50) {
        if (dx > 0) prev();
        else next();
      }
    }
    // Reset pinch zoom after short delay
    if (pinchScale > 1) {
      setTimeout(() => { setPinchScale(1); setPanPos({ x: 0, y: 0 }); }, 300);
    }
  }

  function handleDoubleTap(e: MouseEvent<HTMLDivElement>) {
    if (pinchScale > 1) {
      setPinchScale(1);
      setPanPos({ x: 0, y: 0 });
    } else {
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect) {
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPanPos({ x: (x - 50) * 0.5, y: (y - 50) * 0.5 });
        setPinchScale(2);
        setIsZooming(true);
      }
    }
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Main image with touch zoom + swipe */}
        <div
          ref={imgRef}
          className="relative group overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200/50 lg:cursor-zoom-in"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleTap}
        >
          {/* Zoom in button */}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-zinc-900 opacity-0 group-hover:opacity-100 lg:opacity-100"
            aria-label="View fullscreen"
          >
            <ZoomIn className="h-4 w-4" strokeWidth={2} />
          </button>

          <div
            className="relative aspect-square w-full overflow-hidden"
            style={{ touchAction: "pan-x pan-y pinch-zoom" }}
          >
            {imgs.map((src, i) => (
              <div
                key={src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  i === active ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0",
                )}
              >
                <motion.img
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  className="h-full w-full object-cover select-none"
                  draggable={false}
                  animate={{
                    scale: isZooming ? Math.max(pinchScale, 1) : 1,
                    x: panPos.x,
                    y: panPos.y,
                  }}
                  transition={{ type: "tween", duration: 0.25 }}
                />
              </div>
            ))}
          </div>

          {/* Touch swipe hint (mobile only, shown once) */}
          {imgs.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 lg:hidden">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    i === active ? "w-6 bg-white shadow-sm" : "w-2 bg-white/50",
                  )}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Desktop navigation arrows */}
          {imgs.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-zinc-900 lg:flex"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-zinc-900 lg:flex"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Image counter */}
          {imgs.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white lg:hidden">
              <span>{active + 1}</span>
              <span>/</span>
              <span>{imgs.length}</span>
            </div>
          )}
        </div>

        {/* Thumbnails (desktop only) */}
        {imgs.length > 1 && (
          <div className="hidden gap-2 overflow-x-auto pb-1 lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {imgs.map((src, i) => (
              <button
                key={`${src}-thumb`}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  i === active
                    ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-1"
                    : "border-zinc-200 hover:border-zinc-300",
                )}
              >
                <img src={src} alt={`${alt} ${i + 1} thumbnail`} className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900 backdrop-blur-sm"
            onClick={() => { setLightbox(false); setPinchScale(1); setPanPos({ x: 0, y: 0 }); }}
          >
            <motion.button
              type="button"
              onClick={() => { setLightbox(false); setPinchScale(1); setPanPos({ x: 0, y: 0 }); }}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 z-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </motion.button>

            {/* Lightbox images */}
            <motion.div
              className="relative w-full h-full max-w-none flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src={imgs[active]}
                  alt={alt}
                  className="max-h-[85vh] max-w-[95vw] rounded-2xl object-contain select-none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25 }}
                  draggable={false}
                />
              </AnimatePresence>
            </motion.div>

            {imgs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={2} />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === active ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
