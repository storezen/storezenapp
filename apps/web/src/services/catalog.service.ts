import { apiFetch } from "@/lib/api";
import { mapProductsFromApi } from "@/lib/map-product";
import type { HomePageContentV1 } from "@/lib/cms/homepage-block-types";
import type { Product } from "@/types";

/** Public store profile (unauthenticated) — use for `storeId`, pixels, theme, and homepage CMS. */
export async function getPublicStoreBySlug(storeSlug: string): Promise<{
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metaPixel?: string | null;
  tiktokPixel?: string | null;
  whatsappNumber?: string | null;
  themeColors?: unknown;
  homePage: HomePageContentV1;
}> {
  return apiFetch(`/stores/${encodeURIComponent(storeSlug)}`) as Promise<{
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    metaPixel?: string | null;
    tiktokPixel?: string | null;
    whatsappNumber?: string | null;
    themeColors?: unknown;
    homePage: HomePageContentV1;
  }>;
}

export type PublicProductSort = "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

export async function listPublicProducts(
  storeSlug: string,
  opts?: {
    collectionId?: string;
    q?: string;
    sort?: PublicProductSort;
    limit?: number;
    cursor?: string;
  },
): Promise<{ products: Product[]; nextCursor: string | null }> {
  const u = new URLSearchParams();
  u.set("store_slug", storeSlug);
  if (opts?.collectionId) u.set("collection_id", opts.collectionId);
  if (opts?.q?.trim()) u.set("q", opts.q.trim());
  if (opts?.sort) u.set("sort", opts.sort);
  if (opts?.limit != null) u.set("limit", String(opts.limit));
  if (opts?.cursor) u.set("cursor", opts.cursor);
  const path = `/products/public?${u.toString()}`;
  try {
    const res = (await apiFetch(path)) as { products?: unknown[]; nextCursor?: string | null } | unknown[];
    if (!res || typeof res !== "object") return { products: [], nextCursor: null };
    const r = res as Record<string, unknown>;
    const list = Array.isArray(res) ? res : (r.products ?? []);
    return {
      products: mapProductsFromApi(list as unknown[]),
      nextCursor: r.nextCursor != null ? String(r.nextCursor) : null,
    };
  } catch (e) {
    console.error("[listPublicProducts] error:", e);
    return { products: [], nextCursor: null };
  }
}

export type StoreCollection = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sortOrder?: number;
  maxProducts?: number | null;
};

export async function listPublicCollections(storeSlug: string): Promise<StoreCollection[]> {
  const res = (await apiFetch(`/store-collections/public?store_slug=${encodeURIComponent(storeSlug)}`)) as {
    collections?: StoreCollection[];
  };
  return res.collections ?? [];
}
