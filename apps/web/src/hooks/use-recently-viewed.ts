"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types";

const STORAGE_KEY = "rv_products";
const MAX_RECENT = 8;

type RecentEntry = {
  product: Product;
  viewedAt: number;
};

function getRecent(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(entries: RecentEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const track = useCallback((product: Product) => {
    const entry: RecentEntry = {
      product,
      viewedAt: Date.now(),
    };
    setRecent((prev) => {
      const withoutCurrent = prev.filter((e) => e.product.id !== product.id);
      const updated = [entry, ...withoutCurrent].slice(0, MAX_RECENT);
      saveRecent(updated);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }, []);

  const products = recent.map((e) => e.product).filter((p) => p.id !== "draft-preview");

  return { products, track, clear };
}