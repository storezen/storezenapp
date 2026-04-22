import { useMemo } from "react";
import { DEFAULT_STORE_SLUG } from "@/config";

function hostnameLooksLikeVercelPreview(host: string): boolean {
  const h = host.toLowerCase();
  return h.endsWith(".vercel.app");
}

/**
 * Derive tenant slug from hostname (no port).
 *
 * Supported shapes:
 * - `store1.storepk.com` → `store1`
 * - `store1.localhost` (e.g. dev with `store1.localhost:5173`) → `store1`
 * - `storepk.com` / `www.storepk.com` → default slug (landing)
 * - `localhost` / `127.0.0.1` → default slug
 * - `*.vercel.app` preview hosts → default slug (hostname is not a tenant subdomain)
 */
export function getStoreSlugFromHostname(hostname: string): string {
  const host = hostname.split(":")[0]?.toLowerCase().trim() ?? "";
  if (!host) return DEFAULT_STORE_SLUG;

  if (host === "localhost" || host === "127.0.0.1") return DEFAULT_STORE_SLUG;

  if (hostnameLooksLikeVercelPreview(host)) {
    return DEFAULT_STORE_SLUG;
  }

  const parts = host.split(".").filter(Boolean);

  if (parts.length >= 3) {
    const first = parts[0];
    if (first && first !== "www") return first;
    return DEFAULT_STORE_SLUG;
  }

  if (parts.length === 2 && parts[1] === "localhost") {
    const first = parts[0];
    if (first && first !== "www") return first;
    return DEFAULT_STORE_SLUG;
  }

  return DEFAULT_STORE_SLUG;
}

/** Current store slug from `window.location.hostname`. */
export function useStoreSlug(): string {
  return useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_STORE_SLUG;
    return getStoreSlugFromHostname(window.location.hostname);
  }, []);
}
