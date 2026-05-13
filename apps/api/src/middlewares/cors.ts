import cors from "cors";
import type { CorsOptions } from "cors";

/** Apex + tenant subdomains for the storefront (wildcard DNS). */
function storePublicRootDomain(): string {
  return (process.env.STORE_PUBLIC_ROOT_DOMAIN ?? "storepk.com").trim().toLowerCase().replace(/^\.+/, "");
}

function parseAllowedOrigins(): string[] {
  const raw = process.env.FRONTEND_ORIGINS?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Hostname is apex, www, or any tenant subdomain of the public store domain. */
function isPublicStoreHostname(hostname: string): boolean {
  const root = storePublicRootDomain();
  if (!root) return false;
  const host = hostname.toLowerCase();
  if (host === root || host === `www.${root}`) return true;
  return host.endsWith(`.${root}`);
}

function isStorePkVercelAppHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "storepk.vercel.app" || host.endsWith(".storepk.vercel.app");
}

function isLocalDevHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host.endsWith(".localhost");
}

/**
 * Dynamic CORS: wildcard tenants on the public domain, Vercel app host(s),
 * explicit allowlist, and localhost in development.
 */
export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void,
): void {
  if (!origin) {
    callback(null, true);
    return;
  }

  const root = storePublicRootDomain();
  if (root && origin.endsWith(`.${root}`)) {
    callback(null, true);
    return;
  }

  let hostname = "";
  try {
    hostname = new URL(origin).hostname;
  } catch {
    callback(new Error("Not allowed by CORS"));
    return;
  }

  if (isPublicStoreHostname(hostname)) {
    callback(null, true);
    return;
  }
  if (isStorePkVercelAppHostname(hostname)) {
    callback(null, true);
    return;
  }

  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  // Allow localhost in both dev and production for local testing
  if (isLocalDevHostname(hostname)) {
    callback(null, true);
    return;
  }

  callback(new Error("Not allowed by CORS"));
}

const corsOptions: CorsOptions = {
  origin: corsOriginCallback,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
