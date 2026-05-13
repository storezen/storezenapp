"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2, Package, Truck, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { trackInitiateCheckout } from "@/lib/analytics";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: Props) {
  const { items, total, updateQty, removeItem } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const delivery = total >= 2000 ? 0 : 200;
  const savings = delivery === 0 ? 200 : 0;
  const grandTotal = total + delivery;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-zinc-900">Your Cart</h2>
                  <p className="text-xs text-zinc-500">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                    {delivery === 0 && <span className="ml-2 text-emerald-600">· Free Delivery</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close cart"
              >
                <span className="text-lg leading-none font-light">&times;</span>
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-4 border-b border-zinc-100 bg-emerald-50/60 px-4 py-2">
              {[
                { icon: RotateCcw, text: "Parcel Open OK" },
                { icon: Truck, text: "COD Available" },
                { icon: Package, text: "2-5 Day Delivery" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                  <Icon className="h-3 w-3" strokeWidth={2} />
                  {text}
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100"
                  >
                    <ShoppingCart className="h-9 w-9 text-zinc-300" strokeWidth={1.5} />
                  </motion.div>
                  <p className="text-[15px] font-semibold text-zinc-700">Your cart is empty</p>
                  <p className="mt-1 text-sm text-zinc-400">Add products to start shopping</p>
                  <Link href="/products" onClick={onClose} className="mt-6">
                    <Button size="lg" className="gap-2">
                      Browse Products
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Button>
                  </Link>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <motion.li
                        key={item.lineKey}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="group flex gap-3.5 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* Image */}
                        <div className="h-22 w-22 shrink-0 overflow-hidden rounded-xl bg-zinc-50">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-6 w-6 text-zinc-200" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                          <div>
                            <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-zinc-900">{item.name}</p>
                            <p className="mt-0.5 text-[12px] text-zinc-500">
                              {formatCurrency(item.price)} × {item.qty}
                            </p>
                          </div>
                          <div className="flex items-end justify-between gap-2">
                            <p className="text-[15px] font-bold text-zinc-900">
                              {formatCurrency(item.price * item.qty)}
                            </p>
                            {/* Qty Controls */}
                            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQty(item.lineKey, Math.max(0, item.qty - 1))}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                              <span className="w-6 text-center text-[13px] font-semibold tabular-nums text-zinc-900">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.lineKey, item.qty + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.lineKey)}
                          className="self-start mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-100 bg-white px-5 py-4">
              {items.length > 0 && (
                <>
                  <div className="mb-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Subtotal</span>
                      <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Delivery</span>
                      <span className={delivery === 0 ? "font-semibold text-emerald-600" : "text-zinc-900"}>
                        {delivery === 0 ? (
                          <span className="flex items-center gap-1">
                            <span>FREE</span>
                            <span className="text-[10px] text-emerald-500 line-through">{formatCurrency(200)}</span>
                          </span>
                        ) : (
                          formatCurrency(delivery)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
                      <span className="font-semibold text-zinc-900">Total</span>
                      <span className="text-xl font-extrabold tracking-tight text-zinc-900">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  {total < 2000 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-4 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center"
                    >
                      <p className="text-xs text-amber-700">
                        Add{" "}
                        <span className="font-bold">{formatCurrency(2000 - total)}</span>
                        {" "}more for{" "}
                        <span className="font-bold text-emerald-600">FREE delivery</span>
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
                        <motion.div
                          className="h-full rounded-full bg-amber-400"
                          initial={{ width: `${(total / 2000) * 100}%` }}
                          animate={{ width: `${(total / 2000) * 100}%` }}
                          transition={{ type: "spring", damping: 20 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <Link
                    href="/checkout"
                    onClick={() => {
                      trackInitiateCheckout(grandTotal, itemCount);
                      onClose();
                    }}
                    className="block"
                  >
                    <Button className="w-full gap-2 text-base font-bold" size="xl">
                      Proceed to Checkout
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Button>
                  </Link>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full text-center text-sm text-zinc-400 transition-colors hover:text-zinc-600"
                  >
                    Continue shopping
                  </button>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
