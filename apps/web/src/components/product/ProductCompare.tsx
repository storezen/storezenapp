"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowRight, Package, TrendingDown } from "lucide-react";
import { usePublicCatalog } from "@/hooks/use-products";
import type { Product } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

type CompareProduct = {
  product: Product;
  addedAt: number;
};

const MAX_COMPARE = 3;
const STORAGE_KEY = "compare_products";

function loadSaved(): CompareProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSaved(items: CompareProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useProductCompare() {
  const [items, setItems] = useState<CompareProduct[]>([]);

  useEffect(() => { setItems(loadSaved()); }, []);

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((i) => i.product.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, { product, addedAt: Date.now() }];
      saveSaved(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product.id !== id);
      saveSaved(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => { saveSaved([]); setItems([]); }, []);

  return { items, add, remove, clear, isFull: items.length >= MAX_COMPARE };
}

export function CompareBar() {
  const { items, add, remove, clear, isFull } = useProductCompare();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white shadow-lg">
      <div className="shop-container flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700">
            {items.length}/{MAX_COMPARE} to compare
          </span>
          <div className="flex gap-2">
            {items.map((i) => (
              <div key={i.product.id} className="relative">
                {i.product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.product.images[0]} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-zinc-100" />
                )}
                <button
                  type="button"
                  onClick={() => remove(i.product.id)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-bold leading-4"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length >= 2 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Compare now
            </button>
          )}
          <button type="button" onClick={clear} className="text-xs text-zinc-400 hover:text-zinc-700">
            Clear
          </button>
        </div>
      </div>

      {open && <CompareModal products={items.map((i) => i.product)} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CompareModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const fields = ["Price", "Sale Price", "Stock", "Category", "Rating", "Delivery"];
  const specs = products[0]?.category ? { Category: products[0].category } : {};

  function getValue(p: Product, field: string) {
    switch (field) {
      case "Price": return formatCurrency(p.price);
      case "Sale Price": return p.sale_price ? formatCurrency(p.sale_price) : "—";
      case "Stock": return (p.stock ?? 0) === 0 ? "Out of stock" : `${p.stock} units`;
      case "Category": return p.category || "—";
      case "Rating": return p.rating ? `${p.rating}/5` : "—";
      case "Delivery": return p.delivery_days ? `${p.delivery_days} days` : "—";
      default: return "—";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-zinc-900">Compare Products</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700">×</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="sticky left-0 w-28 bg-white px-4 py-3 text-left text-xs font-semibold text-zinc-400">Product</th>
                {products.map((p) => (
                  <th key={p.id} className="min-w-[180px] px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="h-20 w-20 rounded-xl object-cover" />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-zinc-100" />
                      )}
                      <span className="text-[13px] font-semibold text-zinc-900 line-clamp-2">{p.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => {
                const values = products.map((p) => getValue(p, field));
                const hasDiff = values.some((v) => v !== values[0]);
                return (
                  <tr key={field} className={cn("border-b border-zinc-50", hasDiff && "bg-amber-50/30")}>
                    <td className="sticky left-0 bg-white px-4 py-3 text-xs font-medium text-zinc-500">{field}</td>
                    {values.map((val, i) => (
                      <td key={i} className={cn("px-4 py-3 text-center text-sm", hasDiff && "font-semibold text-amber-700")}>{val}</td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <td className="sticky left-0 bg-white px-4 py-3 text-xs font-medium text-zinc-400">Actions</td>
                {products.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center">
                    <a href={`/products/${p.slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900">
                      View <ArrowRight className="h-3 w-3" />
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Floating "Add to Compare" button shown on ProductCard hover */
export function CompareButton({ product }: { product: Product }) {
  const { items, add, remove, isFull } = useProductCompare();
  const isAdded = items.some((i) => i.product.id === product.id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isAdded) remove(product.id);
    else if (!isFull) add(product);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isAdded ? "Remove from compare" : "Add to compare"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-all",
        isAdded
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white/90 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700",
      )}
    >
      <ArrowRight className="h-3.5 w-3.5 -rotate-45" strokeWidth={2} />
    </button>
  );
}
