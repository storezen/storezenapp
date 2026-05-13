"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vendrix-storefront-wishlist-v1";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

/** Persisted wishlist (local only) — toggles sync across tabs on next navigation. */
export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIds(readIds());
  }, []);

  const toggle = useCallback(
    (productId: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  return { has, toggle, ids };
}
