import type { HomeBlock, HomePageContentV1 } from "./homepage-block-types";

export const ADDABLE_SECTION_TYPES = [
  "hero",
  "trust_badges",
  "category_row",
  "featured_products",
  "collection_showcase",
  "promo_strip",
  "marketing_banner",
  "testimonials",
  "stats_kpi",
  "newsletter_signup",
  "activity_feed",
  "blog_teaser",
  "rich_text",
] as const;

export type AddableSectionType = (typeof ADDABLE_SECTION_TYPES)[number];

export const SECTION_FACTORY_LABELS: Record<AddableSectionType, string> = {
  hero: "Hero banner",
  trust_badges: "Trust strip",
  category_row: "Category shortcuts",
  featured_products: "Featured products grid",
  collection_showcase: "Collections showcase",
  promo_strip: "Promo / discount strip",
  marketing_banner: "Marketing banner",
  testimonials: "Testimonials",
  stats_kpi: "Stats / KPI cards",
  newsletter_signup: "Newsletter signup",
  activity_feed: "Activity / orders feed",
  blog_teaser: "Blog / content links",
  rich_text: "Custom text block",
};

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

export function createHomeBlock(type: AddableSectionType): HomeBlock {
  switch (type) {
    case "hero":
      return {
        id: newId("hero"),
        type: "hero",
        enabled: true,
        settings: {
          badge: "NEW",
          title: "Your headline here",
          subtitle: "Supporting line for shoppers.",
          imageUrl: null,
          primaryCta: { label: "Shop now →", href: "/products" },
          secondaryCta: { label: "Learn more", href: "/contact" },
        },
      };
    case "trust_badges":
      return { id: newId("trust"), type: "trust_badges", enabled: true, settings: {} };
    case "category_row":
      return { id: newId("cat"), type: "category_row", enabled: true, settings: { source: "default" } };
    case "featured_products":
      return {
        id: newId("feat"),
        type: "featured_products",
        enabled: true,
        settings: { title: "Featured products", subtitle: "Handpicked for you", limit: 4 },
      };
    case "collection_showcase":
      return {
        id: newId("coll"),
        type: "collection_showcase",
        enabled: true,
        settings: { title: "Shop by collection", subtitle: "Top picks in each collection" },
      };
    case "promo_strip":
      return {
        id: newId("promo"),
        type: "promo_strip",
        enabled: true,
        settings: {
          eyebrow: "PROMO",
          title: "Your offer headline",
          subtitle: "Short supporting copy.",
          cta: { label: "Shop →", href: "/products" },
          background: "gradient_blue",
        },
      };
    case "marketing_banner":
      return {
        id: newId("mkt"),
        type: "marketing_banner",
        enabled: true,
        settings: {
          eyebrow: "FEATURED",
          title: "Marketing message",
          subtitle: "Optional subtitle.",
          imageUrl: null,
          cta: { label: "View", href: "/products" },
          tone: "dark",
        },
      };
    case "testimonials":
      return {
        id: newId("test"),
        type: "testimonials",
        enabled: true,
        settings: {
          title: "What customers say",
          items: [
            { quote: "Great quality and fast delivery.", name: "Ayesha K.", role: "Karachi" },
            { quote: "COD was smooth. Highly recommend.", name: "Bilal M.", role: "Lahore" },
          ],
        },
      };
    case "stats_kpi":
      return {
        id: newId("stat"),
        type: "stats_kpi",
        enabled: true,
        settings: {
          title: "Why shop with us",
          items: [
            { label: "Happy customers", value: "10k+" },
            { label: "Products", value: "500+" },
            { label: "Cities served", value: "All PK" },
          ],
        },
      };
    case "newsletter_signup":
      return {
        id: newId("news"),
        type: "newsletter_signup",
        enabled: true,
        settings: {
          title: "Get deals in your inbox",
          subtitle: "We never spam. Unsubscribe anytime.",
          placeholder: "you@email.com",
          buttonLabel: "Subscribe",
        },
      };
    case "activity_feed":
      return {
        id: newId("act"),
        type: "activity_feed",
        enabled: true,
        settings: {
          title: "Recent activity",
          lines: ["Order #SP-1042 shipped to Lahore", "New arrival: Smart band Pro", "Weekend sale live now"],
        },
      };
    case "blog_teaser":
      return {
        id: newId("blog"),
        type: "blog_teaser",
        enabled: true,
        settings: {
          title: "From the journal",
          subtitle: "Tips, guides, and updates",
          posts: [
            { title: "How to pick a smartwatch", href: "/products" },
            { title: "COD & returns policy", href: "/contact" },
          ],
        },
      };
    case "rich_text":
      return {
        id: newId("txt"),
        type: "rich_text",
        enabled: true,
        settings: {
          title: "Custom message",
          body: "Add your own copy here. Line breaks are preserved. (Plain text only — no HTML for security.)",
        },
      };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function duplicateHomeBlock(block: HomeBlock): HomeBlock {
  const clone = JSON.parse(JSON.stringify(block)) as HomeBlock;
  const prefix = clone.type.replace(/_/g, "");
  (clone as { id: string }).id = newId(prefix);
  return clone;
}

export function removeBlockById(home: HomePageContentV1, id: string): HomePageContentV1 {
  return { ...home, blocks: home.blocks.filter((b) => b.id !== id) };
}

export function reorderBlocks(home: HomePageContentV1, fromIndex: number, toIndex: number): HomePageContentV1 {
  const blocks = [...home.blocks];
  const [m] = blocks.splice(fromIndex, 1);
  if (!m) return home;
  blocks.splice(toIndex, 0, m);
  return { ...home, blocks };
}
