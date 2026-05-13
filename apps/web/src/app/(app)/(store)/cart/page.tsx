"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ArrowLeft, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { DELIVERY_FEE, FREE_SHIPPING_MIN_SUBTOTAL } from "@/lib/constants";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();
  const delivery = total >= FREE_SHIPPING_MIN_SUBTOTAL ? 0 : DELIVERY_FEE;
  const grand = total + delivery;
  const progress = FREE_SHIPPING_MIN_SUBTOTAL > 0 ? Math.min((total / FREE_SHIPPING_MIN_SUBTOTAL) * 100, 100) : 0;

  if (items.length === 0) {
    return (
      <div className="safe-bottom flex min-h-[70vh] items-center justify-center px-4 pt-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100"
          >
            <ShoppingBag className="h-10 w-10 text-zinc-400" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-bold text-zinc-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-zinc-500">Browse products and add what you love.</p>
          <Button size="lg" className="mt-6 h-12 rounded-xl px-8 font-bold shadow-lg shadow-zinc-900/10" asChild>
            <Link href="/products">Shop products</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="safe-bottom pb-28 pt-8 md:pt-10">
      <div className="shop-container">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                Your Cart
              </h1>
              <p className="text-xs text-zinc-500">
                {items.length} item{items.length !== 1 ? "s" : ""} · {formatCurrency(total)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Free delivery progress */}
        {total < FREE_SHIPPING_MIN_SUBTOTAL && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-4"
          >
            <div className="flex items-center justify-between text-xs font-medium text-amber-700">
              <span>Add {formatCurrency(FREE_SHIPPING_MIN_SUBTOTAL - total)} more for free delivery</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
              <motion.div
                className="h-full rounded-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Items */}
          <div className="order-2 lg:order-1 space-y-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.lineKey}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <CartItem
                    item={item}
                    onPlus={() => updateQty(item.lineKey, item.qty + 1)}
                    onMinus={() => updateQty(item.lineKey, item.qty - 1)}
                    onRemove={() => removeItem(item.lineKey)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/60 bg-white px-5 py-4 shadow-sm">
              <button
                onClick={() => items.forEach((item) => removeItem(item.lineKey))}
                className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                Clear cart
              </button>
              <Link href="/products" className="flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700">
                Continue Shopping
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
              <div className="border-b border-zinc-100/60 px-5 py-4">
                <h2 className="text-base font-bold text-zinc-900">Order Summary</h2>
              </div>

              {/* Items preview */}
              <div className="max-h-[180px] overflow-y-auto px-5 py-4">
                {items.map((item) => (
                  <div key={item.lineKey} className="flex items-center gap-3 py-2">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                      {formatCurrency(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-zinc-100/60 px-5 py-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-medium text-zinc-900 tabular-nums">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Delivery</span>
                    <span className={cn("font-medium tabular-nums", delivery === 0 ? "text-emerald-600" : "text-zinc-900")}>
                      {delivery === 0 ? "FREE" : formatCurrency(delivery)}
                    </span>
                  </div>
                  {delivery > 0 && (
                    <p className="text-xs text-amber-600">
                      Add {formatCurrency(FREE_SHIPPING_MIN_SUBTOTAL - total)} for free delivery
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-zinc-100/60 pt-3">
                    <span className="text-base font-bold text-zinc-900">Total</span>
                    <span className="text-xl font-bold tracking-tight text-zinc-900 tabular-nums">
                      {formatCurrency(grand)}
                    </span>
                  </div>
                </div>

                <Button
                  size="xl"
                  className="mt-5 h-12 w-full rounded-xl text-[15px] font-bold shadow-lg shadow-zinc-900/10"
                  asChild
                >
                  <Link href="/checkout">
                    Proceed to Checkout
                    <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                </Button>

                {/* Trust indicators */}
                <div className="mt-4 flex items-center justify-center gap-4 border-t border-zinc-100/60 pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    Secure
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    COD Available
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    Easy Returns
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Total</p>
            <p className="text-lg font-bold tracking-tight text-zinc-900 tabular-nums">
              {formatCurrency(grand)}
            </p>
          </div>
          <Button size="xl" className="h-12 gap-2 px-8 font-bold shadow-lg shadow-zinc-900/10" asChild>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
