"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePublicStore } from "@/contexts/PublicStoreContext";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

export function FrequentlyBoughtTogether({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/store/products/recommendations?productId=${currentProductId}&limit=4`, {
      headers: { "x-store-slug": STORE_SLUG },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.products) setProducts(data.products.slice(0, 4));
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, [currentProductId]);

  if (loading || products.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-zinc-400" strokeWidth={2} />
        <h3 className="text-sm font-bold text-zinc-900">Frequently Bought Together</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
