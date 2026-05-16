import { type NextFunction, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, storesTable } from "../db";

export interface TenantContext {
  storeId: string;
  storeSlug: string;
  storeDomain: string | null;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

/**
 * Tenant Resolution Middleware
 * Resolves store from (in priority order):
 * 1. Subdomain (storeSlug.storezen.com)
 * 2. Custom domain
 * 3. x-store-id header (fallback only)
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    // Priority 1: Subdomain
    const host = req.headers.host;
    if (host) {
      // Check for subdomain pattern: something.storezen.com or something.render.com
      const subdomain = extractSubdomain(host);
      if (subdomain && subdomain !== "www" && subdomain !== "api") {
        const store = await findStoreBySlug(subdomain);
        if (store) {
          req.tenant = {
            storeId: store.id,
            storeSlug: store.slug,
            storeDomain: null,
          };
          return next();
        }
      }
    }

    // Priority 2: Custom domain
    if (host) {
      const store = await findStoreByDomain(host);
      if (store) {
        req.tenant = {
          storeId: store.id,
          storeSlug: store.slug,
          storeDomain: store.domain,
        };
        return next();
      }
    }

    // Priority 3: x-store-id header (fallback - use cautiously)
    const storeIdHeader = req.headers["x-store-id"];
    if (storeIdHeader && typeof storeIdHeader === "string") {
      const store = await findStoreById(storeIdHeader);
      if (store) {
        req.tenant = {
          storeId: store.id,
          storeSlug: store.slug,
          storeDomain: store.domain,
        };
        return next();
      }
    }

    // No tenant found
    return res.status(404).json({
      error: "STORE_NOT_FOUND",
      message: "Store not found for the requested domain or identifier",
    });
  } catch (error) {
    console.error("Tenant resolution error:", error);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to resolve tenant" });
  }
}

function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(":")[0];
  
  // Check for common deployment domains
  const parts = hostname.split(".");
  
  // For .onrender.com, .render.com, etc.
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // For localhost
  if (hostname === "localhost") {
    return null;
  }
  
  // For custom domains with TLD
  if (parts.length >= 2) {
    // Could be subdomain or custom domain - we'll check in resolution
    return parts[0];
  }
  
  return null;
}

async function findStoreBySlug(slug: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.slug, slug))
    .where(eq(storesTable.active, true))
    .limit(1);
  return store || null;
}

async function findStoreByDomain(domain: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.domain, domain))
    .where(eq(storesTable.active, true))
    .limit(1);
  return store || null;
}

async function findStoreById(storeId: string) {
  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, storeId))
    .where(eq(storesTable.active, true))
    .limit(1);
  return store || null;
}
