/**
 * Types for `store_pages.home_blocks` (merchant CMS).
 * Keep in sync with `apps/api/src/validators/home-blocks.validator.ts` and `apps/api/src/lib/home-page.ts`.
 */

/** Optional visibility; when omitted, treated as true (show everywhere). */
export type HomeBlockVisibility = {
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
};

export type CtaLink = {
  label?: string;
  href?: string;
};

export type HeroBlock = HomeBlockVisibility & {
  id: string;
  type: "hero";
  enabled: boolean;
  settings: {
    badge?: string;
    title?: string;
    subtitle?: string;
    imageUrl?: string | null;
    /** Optional looping background video (muted). When set, takes precedence over parallax image. */
    videoUrl?: string | null;
    primaryCta?: CtaLink;
    secondaryCta?: CtaLink;
  };
};

export type TrustBadgesBlock = HomeBlockVisibility & {
  id: string;
  type: "trust_badges";
  enabled: boolean;
  settings: Record<string, never>;
};

export type CategoryRowBlock = HomeBlockVisibility & {
  id: string;
  type: "category_row";
  enabled: boolean;
  settings: {
    source?: "default" | "custom";
  };
};

export type PromoStripBlock = HomeBlockVisibility & {
  id: string;
  type: "promo_strip";
  enabled: boolean;
  settings: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    cta?: CtaLink;
    background?: "gradient_blue" | "gradient_dark" | "solid";
  };
};

export type FeaturedProductsBlock = HomeBlockVisibility & {
  id: string;
  type: "featured_products";
  enabled: boolean;
  settings: {
    title?: string;
    subtitle?: string;
    limit?: number;
  };
};

export type CollectionShowcaseBlock = HomeBlockVisibility & {
  id: string;
  type: "collection_showcase";
  enabled: boolean;
  settings: {
    title?: string;
    subtitle?: string;
  };
};

export type TestimonialItem = { quote: string; name: string; role?: string };

export type TestimonialsBlock = HomeBlockVisibility & {
  id: string;
  type: "testimonials";
  enabled: boolean;
  settings: {
    title?: string;
    items?: TestimonialItem[];
  };
};

export type StatKpiItem = { label: string; value: string };

export type StatsKpiBlock = HomeBlockVisibility & {
  id: string;
  type: "stats_kpi";
  enabled: boolean;
  settings: {
    title?: string;
    items?: StatKpiItem[];
  };
};

export type NewsletterSignupBlock = HomeBlockVisibility & {
  id: string;
  type: "newsletter_signup";
  enabled: boolean;
  settings: {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    buttonLabel?: string;
  };
};

export type ActivityFeedBlock = HomeBlockVisibility & {
  id: string;
  type: "activity_feed";
  enabled: boolean;
  settings: {
    title?: string;
    lines?: string[];
  };
};

export type BlogTeaserPost = { title: string; href: string };

export type BlogTeaserBlock = HomeBlockVisibility & {
  id: string;
  type: "blog_teaser";
  enabled: boolean;
  settings: {
    title?: string;
    subtitle?: string;
    posts?: BlogTeaserPost[];
  };
};

export type MarketingBannerBlock = HomeBlockVisibility & {
  id: string;
  type: "marketing_banner";
  enabled: boolean;
  settings: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    imageUrl?: string | null;
    cta?: CtaLink;
    tone?: "light" | "dark";
  };
};

/** Plain text + title — safe alternative to raw HTML embeds. */
export type RichTextBlock = HomeBlockVisibility & {
  id: string;
  type: "rich_text";
  enabled: boolean;
  settings: {
    title?: string;
    body?: string;
  };
};

export type HomeBlock =
  | HeroBlock
  | TrustBadgesBlock
  | CategoryRowBlock
  | FeaturedProductsBlock
  | CollectionShowcaseBlock
  | PromoStripBlock
  | MarketingBannerBlock
  | TestimonialsBlock
  | StatsKpiBlock
  | NewsletterSignupBlock
  | ActivityFeedBlock
  | BlogTeaserBlock
  | RichTextBlock;

export type HomePageContentV1 = {
  version: 1;
  blocks: HomeBlock[];
};

const DEFAULT: HomePageContentV1 = {
  version: 1,
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      enabled: true,
      settings: {
        badge: "NEW ARRIVALS 2026",
        title: "Discover Premium Smartwatches & Accessories",
        subtitle: "Every piece carefully selected. Cash on Delivery across Pakistan.",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1800&auto=format&fit=crop",
        primaryCta: { label: "Shop Now →", href: "/products" },
        secondaryCta: { label: "View All Products", href: "/products" },
      },
    },
    { id: "trust-1", type: "trust_badges", enabled: true, settings: {} },
    { id: "categories-1", type: "category_row", enabled: true, settings: { source: "default" } },
    {
      id: "featured-1",
      type: "featured_products",
      enabled: true,
      settings: { title: "Featured Products", subtitle: "Handpicked for you", limit: 4 },
    },
    {
      id: "collections-1",
      type: "collection_showcase",
      enabled: true,
      settings: { title: "Shop by collection", subtitle: "Top picks in each collection" },
    },
    {
      id: "promo-1",
      type: "promo_strip",
      enabled: true,
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

export function getDefaultHomepageContent(): HomePageContentV1 {
  return JSON.parse(JSON.stringify(DEFAULT)) as HomePageContentV1;
}

export function parseHomePageContent(raw: unknown): HomePageContentV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version === 1 && Array.isArray(o.blocks)) {
    return o as HomePageContentV1;
  }
  return null;
}

export function sectionVisibilityClassName(block: HomeBlockVisibility): string | null {
  const sd = block.showOnDesktop !== false;
  const sm = block.showOnMobile !== false;
  if (!sd && !sm) return "hidden";
  if (sd && sm) return null;
  if (!sm) return "hidden md:block";
  return "md:hidden";
}
