"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types";
import { listPublicProducts, type PublicProductSort } from "@/services/catalog.service";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

type UsePublicCatalogOptions = {
  collectionId: string | null;
  q: string;
  sort: PublicProductSort;
  limit?: number;
  enabled?: boolean;
  infinite?: boolean;
};

export function usePublicCatalog(opts: UsePublicCatalogOptions) {
  const { collectionId, q, sort, limit, enabled = true, infinite = false } = opts;
  const [items, setItems] = useState<Product[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [key, setKey] = useState(0);

  // Load function
  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await listPublicProducts(STORE_SLUG, {
        collectionId: collectionId ?? undefined,
        q: q || undefined,
        sort,
        limit,
      });
      setItems(data.products);
      setNextCursor(data.nextCursor);
      setHasMore(data.nextCursor != null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load products");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, collectionId, q, sort, limit]);

  // Debounced search + load on mount
  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(t);
  }, [q, collectionId, sort, enabled, limit, load, key]);

  // Reload function exposed to callers
  const reload = useCallback(() => {
    setKey((k) => k + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore && nextCursor && enabled) {
      setIsLoadingMore(true);
      try {
        const data = await listPublicProducts(STORE_SLUG, {
          collectionId: collectionId ?? undefined,
          q: q || undefined,
          sort,
          limit,
          cursor: nextCursor,
        });
        setItems((prev) => [...prev, ...data.products]);
        setNextCursor(data.nextCursor);
        setHasMore(data.nextCursor != null);
      } catch {}
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, nextCursor, collectionId, q, sort, limit, enabled]);

  const reset = useCallback(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
  }, []);

  if (infinite) {
    return { items, isLoading, isLoadingMore, error, hasMore, loadMore, reload: load, reset };
  }
  return { products: items as Product[], isLoading, error, reload: load };
}