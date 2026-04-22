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
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h2 className="heading-font text-lg font-bold text-gray-900">Your Cart ({itemCount} items)</h2>
            <button onClick={onClose} className="text-xl text-gray-700" aria-label="Close">×</button>
          </div>

          <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {items.length === 0 ? (
              <p className="text-sm text-gray-600">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.product_id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-md bg-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-primary">{formatCurrency(item.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button className="h-7 w-7 rounded border" onClick={() => updateQty(item.product_id, item.qty - 1)}>-</button>
                        <span className="text-sm">{item.qty}</span>
                        <button className="h-7 w-7 rounded border" onClick={() => updateQty(item.product_id, item.qty + 1)}>+</button>
                        <button className="ml-auto text-xs text-error" onClick={() => removeItem(item.product_id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t bg-gray-50 px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Subtotal</span>
              <span className="heading-font font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>
            <Link href="/checkout" onClick={onClose}>
              <Button className="w-full" size="lg">Proceed to Checkout</Button>
            </Link>
            <button onClick={onClose} className="w-full text-sm text-primary hover:underline">
              Continue shopping
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
