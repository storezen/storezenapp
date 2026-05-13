"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getPublicStoreBySlug } from "@/services/catalog.service";
import { getDefaultHomepageContent, type HomePageContentV1 } from "@/lib/cms/homepage-block-types";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

export type PublicStoreData = Awaited<ReturnType<typeof getPublicStoreBySlug>>;

type Ctx = {
  store: PublicStoreData | null;
  homePage: HomePageContentV1;
  loading: boolean;
  error: string | null;
  /** Bumps a counter so `usePublicCatalog` / `CollectionShowcase` refetch. */
  catalogVersion: number;
  /** Re-fetch store profile (pixels, home CMS) and refresh catalog consumers. */
  refetch: () => void;
  /** After product/collection admin changes only—updates storefront product/collection UIs without a second store request. */
  invalidateCatalog: () => void;
};

const PublicStoreContext = createContext<Ctx | null>(null);

export function PublicStoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<PublicStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const fallbackHome = useRef<HomePageContentV1 | null>(null);
  if (fallbackHome.current == null) fallbackHome.current = getDefaultHomepageContent();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return getPublicStoreBySlug(STORE_SLUG)
      .then((s) => setStore(s))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load store");
        setStore(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const invalidateCatalog = useCallback(() => {
    setCatalogVersion((n) => n + 1);
  }, []);

  const refetch = useCallback(() => {
    setCatalogVersion((n) => n + 1);
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const homePage = store?.homePage ?? fallbackHome.current!;

  const value = useMemo<Ctx>(
    () => ({
      store,
      homePage,
      loading,
      error,
      catalogVersion,
      refetch,
      invalidateCatalog,
    }),
    [store, homePage, loading, error, catalogVersion, refetch, invalidateCatalog],
  );

  return <PublicStoreContext.Provider value={value}>{children}</PublicStoreContext.Provider>;
}

export function usePublicStore() {
  const c = useContext(PublicStoreContext);
  if (!c) {
    throw new Error("usePublicStore must be used within PublicStoreProvider");
  }
  return c;
}

/** Safe for use outside provider (e.g. tests) — returns null and no-ops. */
export function useOptionalPublicStore() {
  return useContext(PublicStoreContext);
}
