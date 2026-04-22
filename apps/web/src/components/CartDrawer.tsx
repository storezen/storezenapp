"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: Props) {
  const { items, total, updateQty, removeItem } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <button
        className={`fixed inset-0 z-40 bg-black/45 transition ${open ? "visible opacity-100" : "invisible opacity-0"}`}
        onClick={onClose}
        aria-label="Close cart drawer"
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <h2 className="section-title text-lg font-bold text-[#1a1a1a]">Your Cart</h2>
            <button onClick={onClose} className="text-xl text-gray-700" aria-label="Close">×</button>
          </div>

          <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {items.length === 0 ? (
              <div className="space-y-3 py-10 text-center">
                <p className="text-sm text-secondary">Your cart is empty</p>
                <Link href="/products" onClick={onClose}>
                  <Button className="w-full">Shop Products</Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product_id} className="rounded-md border border-border p-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-md bg-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm font-semibold text-[#000]">{formatCurrency(item.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button className="h-7 w-7 rounded border border-border" onClick={() => updateQty(item.product_id, item.qty - 1)}>-</button>
                        <span className="text-sm">{item.qty}</span>
                        <button className="h-7 w-7 rounded border border-border" onClick={() => updateQty(item.product_id, item.qty + 1)}>+</button>
                        <button className="ml-auto text-xs text-accent" onClick={() => removeItem(item.product_id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-border bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Subtotal</span>
              <span className="section-title font-bold text-[#000]">{formatCurrency(total)}</span>
            </div>
            <Link href="/checkout" onClick={onClose}>
              <Button className="w-full" size="lg">Checkout</Button>
            </Link>
            <button onClick={onClose} className="w-full text-sm text-secondary hover:underline">
              Continue shopping
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
