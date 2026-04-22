"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const currentPrice = product.sale_price || product.price;
  const hasSale = Boolean(product.sale_price && product.sale_price < product.price);
  const saveAmount = hasSale ? Math.max(0, product.price - currentPrice) : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-md bg-white transition-smooth hover:-translate-y-1 hover:shadow-hover">
        {hasSale ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-white">Sale</span>
        ) : null}
        <div className="aspect-square overflow-hidden bg-[#fafafa]">
          <img
            src={product.images?.[0] || "https://placehold.co/600x600?text=Product"}
            alt={product.name}
            className="h-full w-full object-cover transition-smooth group-hover:scale-[1.03]"
          />
        </div>
        <div className="space-y-2 px-1 py-3">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-normal text-[#1a1a1a]">{product.name}</h3>
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-[#000]">{formatCurrency(currentPrice)}</p>
          {hasSale ? <p className="text-xs text-secondary line-through">{formatCurrency(product.price)}</p> : null}
          {hasSale ? <p className="text-xs text-accent">Save {formatCurrency(saveAmount)}</p> : null}
        </div>
        </div>
      </article>
    </Link>
  );
}
