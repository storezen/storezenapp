"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, ShoppingCart, Zap, MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { WHATSAPP } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  product: Product;
  selected: ProductVariant | null;
  stock: number;
  price: number;
  qty: number;
  onQtyChange: (n: number) => void;
};

export function StickyAddToCart({ product, selected, stock, price, qty, onQtyChange }: Props) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const inWishlist = has(product.id);
  const outOfStock = stock <= 0;
  const total = price * qty;
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    if (outOfStock) return;
    addItem({
      product_id: product.id,
      name: selected ? `${product.name} (${selected.name})` : product.name,
      price,
      qty,
      image: (product.images ?? [])[0] || "",
      variantId: selected?.id,
      variantName: selected?.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/checkout");
  }

  const productName = selected ? `${product.name} (${selected.name})` : product.name;

  return (
    <>
      {/* Expanded details sheet */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setExpanded(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-8 pt-4 shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-zinc-200" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-zinc-900">Product Details</h3>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Product name */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Product</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">{productName}</p>
                </div>

                {/* Price breakdown */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Unit Price</p>
                    <p className="mt-1 text-lg font-extrabold text-zinc-900 tabular-nums">{formatCurrency(price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Quantity</p>
                    <p className="mt-1 text-lg font-extrabold text-zinc-900">{qty}</p>
                  </div>
                </div>

                {/* Stock status */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <span className="text-sm font-medium text-zinc-700">Availability</span>
                  <span className={cn("text-sm font-semibold", outOfStock ? "text-red-500" : "text-emerald-600")}>
                    {outOfStock ? "Out of Stock" : `${stock} in stock`}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Description</p>
                    <p className="mt-1 text-sm text-zinc-600">{product.description}</p>
                  </div>
                )}

                {/* Delivery info */}
                <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    Delivery in 2-5 business days
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    COD Available · Parcel Open OK
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                  <span className="text-base font-bold text-zinc-900">Total</span>
                  <span className="text-2xl font-extrabold text-zinc-900 tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/98 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Price */}
          <div className="flex min-w-0 flex-col">
            <span className="text-[13px] font-bold text-zinc-900 tabular-nums">{formatCurrency(total)}</span>
            {outOfStock ? (
              <span className="text-[10px] font-semibold text-red-500">Out of stock</span>
            ) : (
              <span className="text-[10px] text-zinc-400">{stock} left</span>
            )}
          </div>

          {/* Qty controls */}
          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              type="button"
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
              aria-label="Decrease"
            >
              <Minus className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <span className="w-7 text-center text-[13px] font-bold tabular-nums text-zinc-900">{qty}</span>
            <button
              type="button"
              onClick={() => onQtyChange(qty + 1)}
              disabled={qty >= stock}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-30"
              aria-label="Increase"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>

          {/* Add to cart */}
          <motion.button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            animate={added ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[12px] font-bold transition-all",
              added
                ? "bg-emerald-600 text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700",
              outOfStock && "bg-zinc-200 text-zinc-400 cursor-not-allowed",
            )}
          >
            {added ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                Add
              </>
            )}
          </motion.button>

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => toggle(product.id)}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all",
              inWishlist ? "border-red-200 bg-red-50 text-red-500" : "border-zinc-200 text-zinc-400",
            )}
            aria-label="Wishlist"
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} strokeWidth={2} />
          </button>

          {/* Expand details */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600"
            aria-label="View details"
          >
            <ChevronUp className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} strokeWidth={2} />
          </button>
        </div>

        {/* Buy Now row (shown below price row) */}
        <div className="flex items-center gap-2 px-4 pb-3">
          {WHATSAPP && (
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, I want to order: ${productName} (${formatCurrency(price)} x ${qty} = ${formatCurrency(total)})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              WhatsApp Order
            </a>
          )}
          <Button
            onClick={handleBuyNow}
            disabled={outOfStock}
            size="md"
            className="flex-1 h-10 rounded-xl gap-2 text-xs font-bold"
          >
            <Zap className="h-4 w-4" strokeWidth={2} />
            Buy Now
          </Button>
        </div>
      </div>
    </>
  );
}
