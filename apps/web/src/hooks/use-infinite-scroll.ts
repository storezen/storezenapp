"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions<T> = {
  fetchFn: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>;
  initialCursor?: string | null;
};

export function useInfiniteScroll<T>({ fetchFn, initialCursor = null }: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchFn(cursor);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor != null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [cursor, fetchFn, loading, hasMore]);

  // Load initial
  useEffect(() => { void load(); }, []);

  // Attach intersection observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          void load();
        }
      },
      { threshold: 0.1 },
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, load]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(initialCursor);
    setHasMore(true);
  }, [initialCursor]);

  function setSentinelRef(el: HTMLDivElement | null) {
    sentinelRef.current = el;
    if (el && observerRef.current) {
      observerRef.current.observe(el);
    }
  }

  return { items, loading, error, hasMore, reset, sentinelRef: setSentinelRef };
}