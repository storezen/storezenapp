import { useMemo } from "react";
import { DEFAULT_STORE_SLUG } from "@/config";

const rootFromEnv = import.meta.env.VITE_STORE_PUBLIC_ROOT_DOMAIN as string | undefined;

/**
 * Tenant slug from browser hostname. Mirrors API `storeFromHostMiddleware` logic
 * when `VITE_STORE_PUBLIC_ROOT_DOMAIN` is set (keep the same value as API `STORE_PUBLIC_ROOT_DOMAIN`).
 */
export function getStoreSlugFromHostname(hostname: string): string {
  const host = hostname.split(":")[0]?.toLowerCase().trim() ?? "";
  if (!host) return DEFAULT_STORE_SLUG;

  const root = rootFromEnv?.trim().replace(/^\.+/, "").replace(/\.+$/, "");
  if (root) {
    if (!host.endsWith(root)) return DEFAULT_STORE_SLUG;
    if (host === root || host === `www.${root}`) return DEFAULT_STORE_SLUG;
    const subChain = host.slice(0, Math.max(0, host.length - root.length - 1));
    if (!subChain) return DEFAULT_STORE_SLUG;
    const first = subChain.split(".")[0];
    if (first && first !== "www") return first;
    return DEFAULT_STORE_SLUG;
  }

  const parts = host.split(".");
  if (parts.length >= 3 && parts[0] && parts[0] !== "www") return parts[0];
  if (parts.length === 2 && parts[1] === "localhost" && parts[0] && parts[0] !== "www") return parts[0];
  return DEFAULT_STORE_SLUG;
}

/** Current store slug derived from `window.location.hostname` (falls back to env default). */
export function useStoreSlug(): string {
  return useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_STORE_SLUG;
    return getStoreSlugFromHostname(window.location.hostname);
  }, []);
}
