"use client";

import { useEffect } from "react";
import { usePublicStore } from "@/contexts/PublicStoreContext";
import { trackStoreVisitor } from "@/lib/visitor-tracking";

export function VisitorTracker() {
  const { store, loading } = usePublicStore();

  useEffect(() => {
    if (loading || !store?.id) return;

    // Track visitor on page load
    trackStoreVisitor(store.id, window.location.pathname);

    // Keep session alive with periodic pings
    const interval = setInterval(() => {
      trackStoreVisitor(store.id, window.location.pathname);
    }, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, [store, loading]);

  return null;
}