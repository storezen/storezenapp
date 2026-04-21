import { useEffect, useState } from "react";
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

function normalizeProduct(p: ApiProduct): Product {
  const images = Array.isArray(p.images) ? p.images.filter((x): x is string => typeof x === "string") : [];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price ?? 0),
    compareAtPrice: p.salePrice != null ? Number(p.salePrice) : undefined,
    description: p.description ?? "",
    category: p.category ?? "General",
    image: images[0] ?? "/placeholder.svg",
    images,
    stock: p.stock ?? 0,
    status: p.isActive === false ? "draft" : "active",
  };
}

export function useProducts(): Product[] {
  const { storeSlug } = useStore();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const url = new URL(`${API_URL}/products/public`);
        url.searchParams.set("store_slug", storeSlug);
        const resp = await fetch(url.toString());
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error ?? "Failed to load products");
        const rows = Array.isArray(data?.products) ? data.products : [];
        if (mounted) setProducts(rows.map(normalizeProduct));
      } catch {
        if (mounted) setProducts([]);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [storeSlug]);

  return products;
}
