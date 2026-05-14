import type { NextFunction, Request, Response } from "express";

/**
 * Reads `X-Forwarded-Host` (proxies) then `Host`, parses optional tenant subdomain,
 * and exposes `req.storeSlugFromHost`. When `store_slug` query is missing, sets it
 * so public product routes keep working without repeating the slug in the URL.
 *
 * Optional: set `STORE_PUBLIC_ROOT_DOMAIN` (e.g. `storezen.pk`) so only hosts under
 * that apex are treated as tenant subdomains (avoids `*.vercel.app` false positives).
 */
function extractStoreSlugFromHost(hostname: string, rootDomain: string | undefined): string | undefined {
  const host = hostname.split(":")[0]?.toLowerCase().trim() ?? "";
  if (!host) return undefined;

  const root = rootDomain?.toLowerCase().replace(/^\.+/, "").replace(/\.+$/, "").trim();
  if (root) {
    if (!host.endsWith(root)) return undefined;
    if (host === root || host === `www.${root}`) return undefined;
    const subChain = host.slice(0, Math.max(0, host.length - root.length - 1));
    if (!subChain) return undefined;
    const first = subChain.split(".")[0];
    return first && first !== "www" ? first : undefined;
  }

  const parts = host.split(".");
  if (parts.length >= 3 && parts[0] && parts[0] !== "www") return parts[0];
  if (parts.length === 2 && parts[1] === "localhost" && parts[0] && parts[0] !== "www") return parts[0];
  return undefined;
}

export function storeFromHostMiddleware(req: Request, _res: Response, next: NextFunction) {
  const forwarded = req.get("x-forwarded-host");
  const raw = (forwarded || req.get("host") || "").split(",")[0]?.trim() ?? "";
  const hostOnly = raw.split(":")[0] ?? "";
  const root = process.env["STORE_PUBLIC_ROOT_DOMAIN"]?.trim() || undefined;
  const slug = extractStoreSlugFromHost(hostOnly, root);

  if (slug) {
    req.storeSlugFromHost = slug;
    const q = req.query as Record<string, unknown>;
    const existing = q["store_slug"];
    if (existing === undefined || existing === "" || existing === null) {
      q["store_slug"] = slug;
    }
  }

  next();
}
