"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, Star, Truck, Wallet, ShieldCheck, Zap, RotateCcw, MessageCircle } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { WHATSAPP } from "@/lib/constants";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { trackAddToCart } from "@/lib/analytics";
import { QuickOrderModal } from "@/components/product/QuickOrderModal";

type Props = {
  product: Product;
  variantList: ProductVariant[] | null;
  selected: ProductVariant | null;
  selVariantId: string | null;
  onSelectVariant: (id: string) => void;
};

export function ProductInfo({ product, variantList, selected, selVariantId, onSelectVariant }: Props) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  const inWishlist = has(product.id);
  const basePrice = product.sale_price || product.price;
  const variantPrice = selected ? selected.price : basePrice;
  const hasSale = product.sale_price != null && product.sale_price < product.price;
  const saveAmount = hasSale ? product.price - variantPrice : 0;
  const discountPct = hasSale && product.price > 0 ? Math.round((saveAmount / product.price) * 100) : 0;
  const stock = selected ? selected.stock : (product.stock ?? 0);
  const lowStockThreshold = product.low_stock_threshold ?? 5;
  const lowStock = (stock ?? 0) > 0 && (stock ?? 0) <= lowStockThreshold;
  const outOfStock = (stock ?? 0) <= 0;

  const waMessage = buildWhatsAppOrderMessage({
    productName: selected ? `${product.name} (${selected.name})` : product.name,
    qty,
    total: variantPrice * qty,
  });

  function handleAddToCart() {
    if (outOfStock) return;
    addItem({
      product_id: product.id,
      name: selected ? `${product.name} (${selected?.name})` : product.name,
      price: variantPrice,
      qty,
      image: (product.images ?? [])[0] || "",
      variantId: selected?.id,
      variantName: selected?.name,
    });
    trackAddToCart(product.id, product.name, qty, variantPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const categoryLabel = (product.category || "General").trim() || "General";

  return (
    <div className="space-y-5">
      {/* Category + Rating */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">{categoryLabel}</p>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border transition-all",
            inWishlist
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600",
          )}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} strokeWidth={2} />
        </button>
      </div>

      {/* Name */}
      <div>
        <h1 className="section-title text-2xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-[28px] md:text-[32px]">
          {product.name}
        </h1>
        {(product.rating != null || product.review_count != null) && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-3.5 w-3.5",
                    s <= Math.round(product.rating ?? 0) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200",
                  )}
                  strokeWidth={0}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">
              {product.rating?.toFixed(1)} ({product.review_count ?? 0} reviews)
            </span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-[36px]">
            {formatCurrency(variantPrice)}
          </span>
          {hasSale && (
            <span className="text-lg font-semibold text-zinc-400 line-through">{formatCurrency(product.price)}</span>
          )}
          {hasSale && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
              -{discountPct}%
            </span>
          )}
        </div>
        {hasSale && (
          <p className="text-sm font-medium text-red-600">You save {formatCurrency(saveAmount)}</p>
        )}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800">
          <Wallet className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          COD Available
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/70 px-2.5 py-1.5 text-[11px] font-semibold text-sky-800">
          <Truck className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          {product.delivery_days ? `${product.delivery_days}–${(product.delivery_days ?? 0) + 2}` : "2–4"} day delivery
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700">
          <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          Authentic
        </span>
      </div>

      {/* Stock indicator */}
      {outOfStock ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-red-700">Out of stock — Notify me</span>
        </div>
      ) : lowStock ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <span className="text-sm font-semibold text-amber-800">Only {stock} left in stock</span>
        </div>
      ) : null}

      {/* Variant selector */}
      {variantList && variantList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-zinc-700">
              {variantList[0]?.name ? (variantList[0]!.name.split(" ")[0] ?? "Option") : "Option"}
              :
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              {selected?.name ?? "Select"}
            </span>
            {selected && variantPrice !== basePrice && (
              <span className="text-sm text-zinc-500">· {formatCurrency(selected.price)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {variantList.map((v) => {
              const vLow = v.stock > 0 && v.stock <= (product.low_stock_threshold ?? 5);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant(v.id)}
                  className={cn(
                    "min-h-[44px] rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                    selVariantId === v.id
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : v.stock <= 0
                        ? "border-zinc-200 bg-zinc-50 text-zinc-300 line-through cursor-not-allowed"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:shadow-sm",
                  )}
                  disabled={v.stock <= 0}
                >
                  <span>{v.name}</span>
                  {v.stock <= 0 && <span className="ml-1 text-[10px]">(Sold out)</span>}
                  {vLow && v.stock > 0 && (
                    <span className="ml-1 text-[10px] text-amber-500">({v.stock} left)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-700">Quantity</p>
        <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-all hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="min-w-[44px] text-center text-[15px] font-bold tabular-nums text-zinc-900">{qty}</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-all hover:bg-zinc-900 hover:text-white"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="space-y-2.5">
        {/* Buy Now (COD) - Primary CTA */}
        <Button
          size="xl"
          className="h-14 w-full rounded-xl bg-emerald-600 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-xl"
          disabled={outOfStock}
          onClick={() => setQuickOrderOpen(true)}
        >
          {outOfStock ? (
            "Out of Stock"
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" strokeWidth={2} />
              Buy Now (COD) · {formatCurrency(variantPrice * qty)}
            </span>
          )}
        </Button>

        {/* Add to Cart - Secondary */}
        <Button
          size="xl"
          variant="secondary"
          className="h-12 w-full rounded-xl border-2 border-zinc-200 text-[14px] font-bold transition-all hover:border-zinc-300 hover:shadow-sm"
          disabled={outOfStock}
          onClick={handleAddToCart}
        >
          {added ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Added to Cart
            </span>
          ) : (
            <>Add to Cart · {formatCurrency(variantPrice * qty)}</>
          )}
        </Button>

        {WHATSAPP && (
          <a
            className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 px-5 text-[14px] font-bold text-emerald-700 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50"
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2} />
            Order on WhatsApp
          </a>
        )}
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
        {[
          { icon: Truck, text: "Fast delivery 2–4 days" },
          { icon: RotateCcw, text: "Easy returns within 7 days" },
          { icon: ShieldCheck, text: "100% authentic products" },
          { icon: Wallet, text: "Cash on delivery available" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[12px] text-zinc-600">
            <Icon className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Quick Order Modal */}
      <QuickOrderModal
        open={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
        product={{
          id: product.id,
          name: selected ? `${product.name} (${selected?.name})` : product.name,
          price: variantPrice,
          sale_price: product.sale_price,
          images: product.images,
        }}
      />
    </div>
  );
}