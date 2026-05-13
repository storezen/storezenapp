"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Zap } from "lucide-react";
import { CdnImage } from "@/components/CdnImage";
import type { Product } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { QuickOrderModal } from "@/components/product/QuickOrderModal";

type ProductCardVariant = "store" | "preview" | "list";

export function ProductCard({ product, variant = "store" }: { product: Product; variant?: ProductCardVariant }) {
  const { addItem } = useCart();
  const isPreview = variant === "preview";
  const isList = variant === "list";

  const currentPrice = product.sale_price ?? product.price;
  const hasSale = product.sale_price != null && product.sale_price < product.price;
  const saveAmount = hasSale ? Math.max(0, product.price - currentPrice) : 0;
  const discountPct = hasSale && product.price > 0 ? Math.round((saveAmount / product.price) * 100) : 0;
  const outOfStock = !product.stock || product.stock <= 0;
  const categoryLabel = (product.category || "General").trim() || "General";

  const [added, setAdded] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (isPreview || outOfStock) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price: currentPrice,
      qty: 1,
      image: product.images?.[0] || "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  // List variant — horizontal layout
  if (isList) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.2 }}
        className="group flex gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      >
        <Link href={`/products/${product.slug}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
          <CdnImage
            src={product.images?.[0] || "https://placehold.co/200x200?text=Product"}
            alt={product.name}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {hasSale && (
            <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              -{discountPct}%
            </span>
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">{categoryLabel}</p>
            <Link href={`/products/${product.slug}`}>
              <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-zinc-900 transition-colors hover:text-zinc-600">
                {product.name}
              </h3>
            </Link>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-base font-extrabold tracking-tight text-zinc-900">{formatCurrency(currentPrice)}</p>
              {hasSale && (
                <p className="text-[11px] text-zinc-400 line-through">{formatCurrency(product.price)}</p>
              )}
            </div>
            {!outOfStock && !isPreview ? (
              <button
                type="button"
                onClick={quickAdd}
                className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Add
              </button>
            ) : outOfStock ? (
              <span className="shrink-0 text-[11px] font-semibold text-red-500">Sold out</span>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      layout={false}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="group/card relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-300 hover:border-zinc-300/80 hover:shadow-md"
    >
      {/* Image section */}
      <div className="relative">
        {isPreview ? (
          <div className="relative block">
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
              <CdnImage
                src={product.images?.[0] || "https://placehold.co/600x750?text=Product"}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
              />
            </div>
          </div>
        ) : (
          <Link href={`/products/${product.slug}`} className="relative block">
            {/* Product image */}
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
              {/* Primary image */}
              <div className="absolute inset-0 transition-opacity duration-500 group-hover/card:opacity-0">
                <CdnImage
                  src={product.images?.[0] || "https://placehold.co/600x750?text=Product"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover"
                  priority={isPreview}
                />
              </div>
              {/* Secondary image on hover */}
              {product.images?.[1] && (
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100">
                  <CdnImage
                    src={product.images[1]}
                    alt={`${product.name} - alternate view`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Category label */}
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{categoryLabel}</p>

        {/* Product name */}
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] sm:text-[14px] font-bold leading-snug tracking-tight text-zinc-900">
          {isPreview ? (
            <span>{product.name}</span>
          ) : (
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-emerald-600">
              {product.name}
            </Link>
          )}
        </h3>

        {/* Rating */}
        <div className="mt-1.5 flex items-center gap-2">
          {product.rating != null ? (
            <>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={cn("h-3 w-3", s <= Math.round(product.rating ?? 0) ? "text-amber-400 fill-amber-400" : "text-zinc-200 fill-zinc-200")} viewBox="0 0 14 14" aria-hidden>
                    <path d="M7 1l1.75 4.67h4.67l-3.5 2.92 1.17 4.67L7 10.75 3.92 13.26l1.17-4.67-3.5-2.92h4.67z" />
                  </svg>
                ))}
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500">({product.review_count ?? 0})</span>
            </>
          ) : (
            <span className="text-[10px] sm:text-[11px] text-zinc-400">No reviews yet</span>
          )}
        </div>

        {/* Spacer */}
        <div className="mt-auto pt-2.5 sm:pt-3">

          {/* Price section - Compact style */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] sm:text-[20px] font-extrabold text-zinc-900">
                {formatCurrency(currentPrice)}
              </span>
              {hasSale && (
                <span className="text-[12px] sm:text-[13px] font-medium text-zinc-400 line-through">{formatCurrency(product.price)}</span>
              )}
            </div>
          </div>

          {/* Sale discount badge */}
          {hasSale && (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                Save {formatCurrency(saveAmount)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-2.5 sm:mt-3 space-y-2">
            {outOfStock ? (
              <button
                type="button"
                disabled
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-[12px] font-bold text-zinc-400 cursor-not-allowed"
              >
                <span className="h-2 w-2 rounded-full bg-zinc-300" />
                Out of Stock
              </button>
            ) : (
              <>
                {/* Buy Now (COD) - Primary CTA */}
                <motion.button
                  type="button"
                  onClick={() => setQuickOrderOpen(true)}
                  whileTap={{ scale: 0.97 }}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[12px] sm:text-[13px] font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-xl"
                >
                  <Zap className="h-3.5 w-3.5" strokeWidth={2} />
                  Buy Now (COD)
                </motion.button>

                {/* Add to Cart - Secondary */}
                <motion.button
                  type="button"
                  onClick={quickAdd}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex h-9 w-full items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 text-[11px] sm:text-[12px] font-bold transition-all duration-200",
                    added
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : "text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                    isPreview && "pointer-events-none select-none opacity-60",
                  )}
                >
                  {added ? (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
                      Add to Cart
                    </>
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Order Modal */}
      <QuickOrderModal
        open={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          sale_price: product.sale_price,
          images: product.images,
        }}
      />
    </motion.article>
  );
}