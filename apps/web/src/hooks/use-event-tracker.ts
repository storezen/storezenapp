"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/api";

type EventType = "page_view" | "product_view" | "add_to_cart" | "begin_checkout" | "purchase" | "search" | "wishlist";

const SESSION_KEY = "visitor_session";

function getOrCreateSession(): string {
  if (typeof window === "undefined") return "";

  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = "s_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

// Event batching - send events every 3-5 seconds
const eventQueue: Array<{ storeId: string; sessionId: string; eventType: EventType; productId?: string; orderId?: string; amount?: number }> = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

function flushEvents() {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue.length = 0;

  // Send batch to server
  eventsToSend.forEach(event => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, storeId: "default" }),
    }).catch(() => {
      // Silent fail - don't break the store
    });
  });
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEvents();
  }, 3000); // Send every 3 seconds
}

// Track a single event (with debouncing)
const lastEventTime = new Map<string, number>();
const DEBOUNCE_MS = 2000;

export function trackEvent(
  eventType: EventType,
  options: { productId?: string; orderId?: string; amount?: number } = {}
) {
  if (typeof window === "undefined") return;

  const key = `${eventType}_${options.productId || ""}_${options.orderId || ""}`;
  const now = Date.now();

  // Debounce duplicate events
  const lastTime = lastEventTime.get(key) || 0;
  if (now - lastTime < DEBOUNCE_MS) return;
  lastEventTime.set(key, now);

  const sessionId = getOrCreateSession();
  eventQueue.push({
    storeId: "default",
    sessionId,
    eventType,
    ...options,
  });

  scheduleFlush();
}

// Auto-track hook for page views
export function usePageViewTracker(storeId?: string) {
  const pathname = usePathname();
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      trackEvent("page_view", {});
    }
  }, [pathname]);
}

// Product view tracker
export function useProductViewTracker(productId?: string) {
  useEffect(() => {
    if (productId) {
      trackEvent("product_view", { productId });
    }
  }, [productId]);
}

// Add to cart tracker
export function useAddToCartTracker() {
  return useCallback((productId: string, amount?: number) => {
    trackEvent("add_to_cart", { productId, amount });
  }, []);
}

// Checkout tracker
export function useCheckoutTracker() {
  return useCallback((orderId: string, amount?: number) => {
    trackEvent("begin_checkout", { orderId, amount });
  }, []);
}

// Purchase tracker
export function usePurchaseTracker() {
  return useCallback((orderId: string, amount: number) => {
    trackEvent("purchase", { orderId, amount });
  }, []);
}

// Search tracker
export function useSearchTracker() {
  return useCallback((query: string) => {
    trackEvent("search", { productId: query });
  }, []);
}

// Wishlist tracker
export function useWishlistTracker() {
  return useCallback((productId: string) => {
    trackEvent("wishlist", { productId });
  }, []);
}

// Combined auto-tracker for store pages
export function useAutoEventTracker(storeId?: string) {
  const pathname = usePathname();
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      trackEvent("page_view", {});
    }
  }, [pathname]);

  // Track product views on product pages
  useEffect(() => {
    if (pathname?.startsWith("/products/")) {
      const productSlug = pathname.split("/products/")[1];
      if (productSlug) {
        trackEvent("product_view", { productId: productSlug });
      }
    }
  }, [pathname]);

  // Track checkout start
  useEffect(() => {
    if (pathname === "/checkout") {
      trackEvent("begin_checkout", {});
    }
  }, [pathname]);
}