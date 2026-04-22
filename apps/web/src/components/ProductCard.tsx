"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const currentPrice = product.sale_price || product.price;
  const hasDiscount = Boolean(product.sale_price && product.sale_price < product.price);
  const discountPercent = hasDiscount ? Math.round(((product.price - currentPrice) / product.price) * 100) : 0;
  const lowStock = product.stock > 0 && product.stock <= 3;
  const outOfStock = product.stock <= 0;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white shadow-card transition-smooth hover:-translate-y-1 hover:shadow-hover">
      {outOfStock ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45">
          <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">Out of stock</span>
        </div>
      ) : null}

      {hasDiscount ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-error px-2 py-1 text-[10px] font-semibold text-white">
          -{discountPercent}%
        </span>
      ) : null}

      <button
        aria-label="Wishlist"
        className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow-sm transition-smooth hover:bg-accent hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 20s-6.7-4.3-9-8c-2.2-3.6.3-8 4.5-8 2 0 3.3 1 4.5 2.5C13.2 5 14.5 4 16.5 4c4.2 0 6.7 4.4 4.5 8-2.3 3.7-9 8-9 8Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.images?.[0] || "https://placehold.co/600x600?text=Product"}
            alt={product.name}
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="space-y-2 p-3">
        <p className="text-xs text-gray-500">{product.category || "General"}</p>
        <h3 className="line-clamp-2 min-h-[44px] text-sm font-bold text-gray-900">{product.name}</h3>
        <div className="flex items-center gap-2">
          <p className="heading-font text-lg font-bold text-primary">{formatCurrency(currentPrice)}</p>
          {product.sale_price ? <p className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</p> : null}
        </div>

        {lowStock ? (
          <span className="inline-block rounded-full bg-warning px-2 py-1 text-[10px] font-semibold text-white">Only {product.stock} left!</span>
        ) : null}

        <span className="inline-block rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-white">Cash on Delivery Available</span>
      </div>

      <div className="p-3 pt-0">
        <Button
          className="w-full"
          disabled={outOfStock}
          onClick={() =>
            addItem({
              product_id: product.id,
              name: product.name,
              price: currentPrice,
              qty: 1,
              image: product.images?.[0] || "",
            })
          }
        >
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
