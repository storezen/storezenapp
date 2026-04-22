import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config";
import { useStore } from "@/hooks/use-store";
import type { Product } from "../data/products";

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  salePrice?: string | number | null;
  stock?: number | null;
  category?: string | null;
  images?: unknown;
  tags?: unknown;
  isActive?: boolean | null;
};

export type UseProductsSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export type UseProductsFilters = {
  category?: string;
  sort?: UseProductsSort;
  search?: string;
};

/** Same list as the array itself; `isLoading` / `error` are non-enumerable for array spreads. */
export type UseProductsResult = Product[] & {
  readonly products: Product[];
  readonly isLoading: boolean;
  readonly error: string | null;
};

function normalizeProduct(p: ApiProduct): Product {
  const images = Array.isArray(p.images) ? p.images.filter((x): x is string => typeof x === "string") : [];
  const listPrice = Number(p.price ?? 0);
  const sale = p.salePrice != null && p.salePrice !== "" ? Number(p.salePrice) : null;
  const currentPrice = sale != null && !Number.isNaN(sale) ? sale : listPrice;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: currentPrice,
    compareAtPrice: sale != null && !Number.isNaN(sale) ? listPrice : undefined,
    description: p.description ?? "",
    category: p.category ?? "General",
    image: images[0] ?? "/placeholder.svg",
    images,
    stock: p.stock ?? 0,
    status: p.isActive === false ? "draft" : "active",
  };
}

function applyClientFilters(
  list: Product[],
  filters: UseProductsFilters | undefined,
): Product[] {
  if (!filters) return list;

  let out = [...list];

  const cat = filters.category;
  if (cat && cat !== "All") {
    out = out.filter((p) => p.category === cat);
  }

  const q = filters.search?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }

  const sort = filters.sort ?? "featured";
  switch (sort) {
    case "price-asc":
      out.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      out.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      break;
  }

  return out;
}

function attachResultMeta(
  products: Product[],
  isLoading: boolean,
  error: string | null,
): UseProductsResult {
  const arr = products.slice() as UseProductsResult;
  Object.defineProperties(arr, {
    products: { value: arr, enumerable: false, writable: false, configurable: true },
    isLoading: { value: isLoading, enumerable: false, writable: false, configurable: true },
    error: { value: error, enumerable: false, writable: false, configurable: true },
  });
  return arr;
}

export function useProducts(filters?: UseProductsFilters): UseProductsResult {
  const { storeSlug } = useStore();
  const [raw, setRaw] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setRaw([]);
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_URL}/products/public`);
        url.searchParams.set("store_slug", storeSlug);
        const resp = await fetch(url.toString());
        const data = (await resp.json().catch(() => ({}))) as { products?: unknown; error?: string };
        if (!resp.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load products");
        }
        const rows = Array.isArray(data?.products) ? data.products : [];
        if (mounted) setRaw(rows.map((row) => normalizeProduct(row as ApiProduct)));
      } catch (err) {
        if (mounted) {
          setRaw([]);
          setError(err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [storeSlug]);

  const filtered = useMemo(() => applyClientFilters(raw, filters), [raw, filters]);

  return useMemo(
    () => attachResultMeta(filtered, isLoading, error),
    [filtered, isLoading, error],
  );
}
