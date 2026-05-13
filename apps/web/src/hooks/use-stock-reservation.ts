"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/api";
import type { CartItem } from "@/types";

const RESERVATION_TTL_MS = 5 * 60 * 1000;

export function useStockReservation() {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    let id = sessionStorage.getItem("reservation_session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("reservation_session", id);
    }
    return id;
  });

  const [active, setActive] = useState<Map<string, { quantity: number; expiresAt: number }>>(new Map());

  // Check expired on mount and interval
  useEffect(() => {
    function prune() {
      setActive((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [productId, res] of next) {
          if (Date.now() > res.expiresAt) {
            next.delete(productId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
    prune();
    const interval = setInterval(prune, 10_000);
    return () => clearInterval(interval);
  }, []);

  const reserve = useCallback(async (productId: string, quantity: number) => {
    const res = await authFetch(`/products/${productId}/reserve`, {
      method: "POST",
      body: JSON.stringify({ sessionId, quantity }),
    });
    const data = await res.json() as { reservation?: { expiresAt: string; quantity: number } };
    if (data.reservation) {
      setActive((prev) => {
        const next = new Map(prev);
        next.set(productId, {
          quantity: data.reservation!.quantity,
          expiresAt: new Date(data.reservation!.expiresAt).getTime(),
        });
        return next;
      });
    }
    return data;
  }, [sessionId]);

  const clear = useCallback((productId: string) => {
    setActive((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  function getAvailableStock(productStock: number) {
    let reserved = 0;
    for (const res of active.values()) {
      reserved += res.quantity;
    }
    return Math.max(0, (productStock ?? 0) - reserved);
  }

  return { reserve, clear, getAvailableStock, sessionId };
}
