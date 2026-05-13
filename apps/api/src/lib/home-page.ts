import { homePageContentSchema, type HomePageContent } from "../validators/home-blocks.validator";

/**
 * Default storefront home document — keep in sync with
 * `apps/web/src/lib/cms/homepage-block-types.ts` (`getDefaultHomepageContent`).
 */
export const DEFAULT_HOME_PAGE: HomePageContent = {
  version: 1,
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      enabled: true,
      showOnDesktop: true,
      showOnMobile: true,
      settings: {
        badge: "NEW ARRIVALS 2026",
        title: "Discover Premium Smartwatches & Accessories",
        subtitle: "Every piece carefully selected. Cash on Delivery across Pakistan.",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1800&auto=format&fit=crop",
        primaryCta: { label: "Shop Now →", href: "/products" },
        secondaryCta: { label: "View All Products", href: "/products" },
      },
    },
    {
      id: "trust-1",
      type: "trust_badges",
      enabled: true,
      showOnDesktop: true,
      showOnMobile: true,
      settings: {},
    },
    {
      id: "categories-1",
      type: "category_row",
      enabled: true,
      showOnDesktop: true,
      showOnMobile: true,
      settings: { source: "default" },
    },
    {
      id: "featured-1",
      type: "featured_products",
      enabled: true,
      showOnDesktop: true,
      showOnMobile: true,
      settings: { title: "Featured Products", subtitle: "Handpicked for you", limit: 4 },
    },
    {
      id: "collections-1",
      type: "collection_showcase",
      enabled: true,
      showOnDesktop: true,
      showOnMobile: true,
      settings: { title: "Shop by collection", subtitle: "Top picks in each collection" },
    },
    {
      id: "promo-1",
      type: "promo_strip",
      enabled: true,
      showOnDesktop: true,
      showOnMobile: true,
      settings: {
        eyebrow: "LIMITED TIME OFFER",
        title: "Up to 50% OFF Smart Watches",
        subtitle: "COD · Free delivery on Rs. 1500+",
        cta: { label: "Shop sale →", href: "/products" },
        background: "gradient_blue",
      },
    },
  ],
};

/** Normalize request body to `{ version: 1, blocks }` for Zod. */
export function normalizePageBody(body: unknown): unknown {
  if (body == null) return null;
  if (Array.isArray(body)) return { version: 1, blocks: body };
  if (typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (o.version === 1 && Array.isArray(o.blocks)) return body;
  if (o.home && typeof o.home === "object") return normalizePageBody(o.home);
  if (o.homePage && typeof o.homePage === "object") return normalizePageBody(o.homePage);
  if (Array.isArray(o.home_blocks)) return { version: 1, blocks: o.home_blocks };
  if (Array.isArray(o.homeBlocks)) return { version: 1, blocks: o.homeBlocks };
  return null;
}

function normalizeFromDb(raw: unknown): unknown {
  if (raw == null) return null;
  if (Array.isArray(raw)) return { version: 1, blocks: raw };
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.version === 1 && Array.isArray(o.blocks)) return raw;
  }
  return null;
}

export function resolveHomePageFromDb(raw: unknown): HomePageContent {
  const n = normalizeFromDb(raw);
  const parsed = homePageContentSchema.safeParse(n);
  if (parsed.success && parsed.data.blocks.length > 0) return parsed.data;
  return DEFAULT_HOME_PAGE;
}

export function parseAndValidateHomePageBody(body: unknown): HomePageContent {
  const n = normalizePageBody(body) ?? body;
  const parsed = homePageContentSchema.safeParse(n);
  if (!parsed.success) {
    const err = new Error("Invalid home page content");
    (err as Error & { zod: unknown }).zod = parsed.error.flatten();
    throw err;
  }
  return parsed.data;
}
