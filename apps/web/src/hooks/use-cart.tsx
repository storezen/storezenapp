"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/types";
import { apiFetch } from "@/lib/api";
import { migrateLegacyCartItem, withLineKey } from "@/lib/cart-line";
import { trackEvent } from "@/lib/analytics";

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineKey">) => void;
  removeItem: (lineKey: string) => void;
  updateQty: (lineKey: string, qty: number) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartCtx | null>(null);

function parseCart(raw: string): CartItem[] {
  try {
    const arr = JSON.parse(raw) as unknown[];
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => migrateLegacyCartItem(x as Record<string, unknown>));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    setItems(raw ? parseCart(raw) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
    if (items.length > 0) {
      localStorage.setItem(
        "abandoned_cart_snapshot",
        JSON.stringify({
          items,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  }, [items]);

  function addItem(item: Omit<CartItem, "lineKey">) {
    const row = withLineKey(item);
    setItems((prev) => {
      const ex = prev.find((x) => x.lineKey === row.lineKey);
      const next = !ex
        ? [...prev, row]
        : prev.map((x) => (x.lineKey === row.lineKey ? { ...x, qty: x.qty + row.qty } : x));
      trackEvent("add_to_cart", {
        productId: row.product_id,
        variantId: row.variantId,
        name: row.name,
        qty: row.qty,
        value: row.price * row.qty,
      });
      return next;
    });
  }

  function removeItem(lineKey: string) {
    setItems((prev) => prev.filter((x) => x.lineKey !== lineKey));
  }

  function updateQty(lineKey: string, qty: number) {
    setItems((prev) => prev.map((x) => (x.lineKey === lineKey ? { ...x, qty } : x)).filter((x) => x.qty > 0));
  }

  function clearCart() {
    setItems([]);
    localStorage.removeItem("abandoned_cart_snapshot");
  }

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  return <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/** Call when user leaves phone on checkout — server sends WhatsApp reminder after delay (see API scheduler). */
export async function submitAbandonedCartSnapshot(input: {
  storeId: string;
  items: CartItem[];
  customerName?: string;
  customerPhone: string;
}) {
  if (input.items.length === 0) return;
  await apiFetch("/carts/abandon", {
    method: "POST",
    body: JSON.stringify({
      storeId: input.storeId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      items: input.items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        variantId: i.variantId,
      })),
    }),
  });
}
