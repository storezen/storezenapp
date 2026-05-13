"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";
const DEBOUNCE_MS = 300;

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  category: string;
  image?: string;
};

export function SearchAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const raw = localStorage.getItem("recent_searches");
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function saveRecent(q: string) {
    if (!q.trim()) return;
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("recent_searches", JSON.stringify(next));
  }

  function clearRecent() {
    setRecent([]);
    localStorage.removeItem("recent_searches");
  }

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(async () => {
      try {
        const data = await apiFetch(
          `/products/public?store_slug=${STORE_SLUG}&q=${encodeURIComponent(value)}&limit=6`,
        ) as { products?: unknown[] };
        const prods = (data.products ?? []) as Product[];
        setSuggestions(
          prods.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            sale_price: p.sale_price,
            category: p.category || "General",
            image: p.images?.[0],
          })),
        );
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(s: Suggestion) {
    saveRecent(s.name);
    setOpen(false);
    onChange(s.name);
    router.push(`/products/${s.slug}`);
  }

  function selectRecent(q: string) {
    onChange(q);
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    saveRecent(value);
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(value)}`);
  }

  const hasResults = suggestions.length > 0;
  const showRecent = !value && recent.length > 0;

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400",
          )}
          strokeWidth={2}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (value) setOpen(true); }}
          placeholder="Search products…"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          </div>
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            ×
          </button>
        )}
      </form>

      {/* Dropdown */}
      {open && (hasResults || showRecent) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          {/* Recent searches */}
          {showRecent && (
            <div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <Clock className="h-3 w-3" strokeWidth={2} />
                  Recent
                </span>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700"
                >
                  Clear
                </button>
              </div>
              {recent.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => selectRecent(q)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-300" strokeWidth={2} />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {hasResults && (
            <div>
              {showRecent && (
                <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <TrendingUp className="h-3 w-3" strokeWidth={2} />
                  Products
                </div>
              )}
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-50"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-900">{s.name}</p>
                    <p className="text-[11px] text-zinc-400">{s.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold text-zinc-900">{formatCurrency(s.sale_price || s.price)}</p>
                    {s.sale_price != null && s.sale_price < s.price && (
                      <p className="text-[10px] text-zinc-400 line-through">{formatCurrency(s.price)}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" strokeWidth={2} />
                </button>
              ))}
              <button
                type="button"
                onClick={handleSubmit}
                className="flex w-full items-center justify-between border-t border-zinc-100 px-3 py-2.5 text-left text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <span>See all results for &ldquo;{value}&rdquo;</span>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}