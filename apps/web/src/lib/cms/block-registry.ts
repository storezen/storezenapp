/**
 * Vendrix CMS Block Registry
 * Canonical source of truth for every block type:
 * - type string, label, icon
 * - JSON Schema for settings validation
 * - default settings
 * - admin editor component path (lazy-loaded)
 * - render component path (lazy-loaded)
 */
import type { ComponentType } from "react";
import {
  LayoutTemplate,
  Star,
  ShoppingBag,
  Layers,
  Timer,
  Tag,
  MessageCircle,
  Video,
  HelpCircle,
  FileText,
  Image,
  Smartphone,
  UserPlus,
  Camera,
  Mail,
  Newspaper,
  Megaphone,
  Zap,
  Code2,
  Quote,
  Users,
  ArrowRightLeft,
} from "lucide-react";

export type BlockCategory =
  | "layout"
  | "content"
  | "commerce"
  | "social"
  | "marketing"
  | "media"
  | "utility";

export interface BlockDefinition {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  category: BlockCategory;
  /** JSON Schema for settings object */
  schema: Record<string, unknown>;
  defaults: Record<string, unknown>;
  /** Min dimensions hint for canvas (columns, rows in a 12-col grid) */
  minGridSpan?: { cols: number; rows: number };
  /** Can this block be added to any page, or only specific page types */
  allowedKinds?: string[];
  /** Is this a core block (true) or premium/extension block */
  isCore?: boolean;
}

export type BlockType = BlockDefinition["type"];

// ── Settings Schemas ───────────────────────────────────────────────────────────

const linkSchema = {
  type: "object",
  properties: {
    label: { type: "string" },
    href: { type: "string" },
  },
};

const ctaSchema = {
  type: "object",
  properties: {
    label: { type: "string" },
    href: { type: "string" },
    variant: { type: "string", enum: ["primary", "secondary", "outline"] },
  },
};

const imageSchema = {
  type: "object",
  properties: {
    url: { type: "string" },
    alt: { type: "string" },
    width: { type: "number" },
    height: { type: "number" },
  },
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  // ── Layout ────────────────────────────────────────────────────────────────
  hero: {
    type: "hero",
    label: "Hero Banner",
    description: "Full-width banner with headline, CTA and background image or video",
    icon: LayoutTemplate,
    category: "layout",
    schema: {
      type: "object",
      properties: {
        badge: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        imageUrl: { type: ["string", "null"] },
        videoUrl: { type: ["string", "null"] },
        primaryCta: ctaSchema,
        secondaryCta: ctaSchema,
        background: { type: "string", enum: ["image", "video", "gradient", "solid", "none"] },
        gradientFrom: { type: "string" },
        gradientTo: { type: "string" },
        textAlign: { type: "string", enum: ["left", "center", "right"] },
        height: { type: "string", enum: ["auto", "screen", "compact", "tall"] },
      },
      required: ["title"],
    },
    defaults: {
      title: "Your Headline Here",
      subtitle: "Add a compelling subheadline that describes your offer",
      background: "image",
      textAlign: "center",
      height: "screen",
      primaryCta: { label: "Shop Now", href: "/products", variant: "primary" },
    },
    minGridSpan: { cols: 12, rows: 6 },
  },

  hero_split: {
    type: "hero_split",
    label: "Hero Split",
    description: "Two-column hero with image on one side, text on the other",
    icon: ArrowRightLeft,
    category: "layout",
    schema: {
      type: "object",
      properties: {
        badge: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        imageUrl: { type: ["string", "null"] },
        imagePosition: { type: "string", enum: ["left", "right"] },
        primaryCta: ctaSchema,
        secondaryCta: ctaSchema,
        height: { type: "string", enum: ["auto", "screen", "compact"] },
      },
      required: ["title"],
    },
    defaults: {
      title: "Your Brand Story",
      subtitle: "Tell visitors what makes your store special",
      imagePosition: "right",
      height: "screen",
    },
    minGridSpan: { cols: 12, rows: 5 },
  },

  announcement_bar: {
    type: "announcement_bar",
    label: "Announcement Bar",
    description: "Sticky top bar for promotions, shipping info or news",
    icon: Megaphone,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        link: { type: "string" },
        background: { type: "string" },
        textColor: { type: "string" },
        icon: { type: "string" },
        dismissible: { type: "boolean" },
      },
      required: ["text"],
    },
    defaults: {
      text: "Free delivery on orders above Rs. 1,500",
      background: "#111111",
      textColor: "#ffffff",
      dismissible: true,
    },
    minGridSpan: { cols: 12, rows: 1 },
    allowedKinds: ["homepage", "landing", "campaign"],
  },

  // ── Commerce ─────────────────────────────────────────────────────────────
  featured_products: {
    type: "featured_products",
    label: "Featured Products",
    description: "Grid of hand-picked or algorithm-selected products",
    icon: ShoppingBag,
    category: "commerce",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        productIds: { type: "array", items: { type: "string" } },
        limit: { type: "number", minimum: 1, maximum: 24 },
        columns: { type: "number", minimum: 2, maximum: 6 },
        source: { type: "string", enum: ["manual", "featured", "newest", "bestselling"] },
        showTitle: { type: "boolean" },
        showPrice: { type: "boolean" },
        showAddToCart: { type: "boolean" },
      },
    },
    defaults: {
      title: "Featured Products",
      subtitle: "Handpicked for you",
      limit: 4,
      columns: 4,
      source: "featured",
      showTitle: true,
      showPrice: true,
      showAddToCart: true,
    },
    minGridSpan: { cols: 12, rows: 4 },
  },

  product_grid: {
    type: "product_grid",
    label: "Product Grid",
    description: "Collection of products with optional filtering and sorting",
    icon: Layers,
    category: "commerce",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        collectionId: { type: "string" },
        category: { type: "string" },
        limit: { type: "number" },
        columns: { type: "number" },
        sortBy: { type: "string", enum: ["newest", "price_asc", "price_desc", "bestselling"] },
        showFilters: { type: "boolean" },
        showSort: { type: "boolean" },
      },
    },
    defaults: {
      title: "All Products",
      limit: 8,
      columns: 4,
      sortBy: "newest",
      showFilters: false,
      showSort: false,
    },
    minGridSpan: { cols: 12, rows: 4 },
  },

  collection_showcase: {
    type: "collection_showcase",
    label: "Collection Showcase",
    description: "Featured collections with cover images and product counts",
    icon: Tag,
    category: "commerce",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        collectionIds: { type: "array", items: { type: "string" } },
        showProductCount: { type: "boolean" },
        columns: { type: "number" },
      },
    },
    defaults: {
      title: "Shop by Collection",
      subtitle: "Explore our curated categories",
      showProductCount: true,
      columns: 4,
    },
    minGridSpan: { cols: 12, rows: 4 },
  },

  deal_countdown: {
    type: "deal_countdown",
    label: "Deal Countdown",
    description: "Countdown timer for flash sales and time-limited offers",
    icon: Timer,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        endDate: { type: "string" },
        cta: ctaSchema,
        background: { type: "string" },
        showDays: { type: "boolean" },
        showHours: { type: "boolean" },
        showMinutes: { type: "boolean" },
        showSeconds: { type: "boolean" },
      },
      required: ["endDate"],
    },
    defaults: {
      title: "Flash Sale Ends In",
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      background: "#ff4757",
    },
    minGridSpan: { cols: 12, rows: 2 },
    allowedKinds: ["homepage", "campaign"],
  },

  category_slider: {
    type: "category_slider",
    label: "Category Slider",
    description: "Horizontal scrolling row of category cards",
    icon: Tag,
    category: "commerce",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        categories: { type: "array", items: { type: "string" } },
        showImages: { type: "boolean" },
        scrollOnMobile: { type: "boolean" },
      },
    },
    defaults: {
      title: "Shop by Category",
      showImages: true,
      scrollOnMobile: true,
    },
    minGridSpan: { cols: 12, rows: 2 },
  },

  flash_sale: {
    type: "flash_sale",
    label: "Flash Sale Banner",
    description: "High-impact sale banner with discount badge and CTA",
    icon: Zap,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        eyebrow: { type: "string" },
        title: { type: "string" },
        discount: { type: "string" },
        cta: ctaSchema,
        background: { type: "string" },
        expiresAt: { type: "string" },
      },
      required: ["title"],
    },
    defaults: {
      eyebrow: "LIMITED TIME",
      title: "Up to 50% OFF",
      discount: "50",
      background: "#111111",
    },
    minGridSpan: { cols: 12, rows: 2 },
    allowedKinds: ["homepage", "campaign"],
  },

  // ── Content ──────────────────────────────────────────────────────────────
  rich_text: {
    type: "rich_text",
    label: "Rich Text",
    description: "Formatted text with title, body paragraphs and optional CTA",
    icon: FileText,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        align: { type: "string", enum: ["left", "center", "right"] },
        maxWidth: { type: "string" },
        cta: ctaSchema,
      },
    },
    defaults: {
      title: "About Our Store",
      body: "Write something great about your brand here. Tell your story, share your mission, and connect with your customers.",
      align: "center",
      maxWidth: "720px",
    },
    minGridSpan: { cols: 8, rows: 2 },
  },

  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer reviews carousel or grid",
    icon: Quote,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              quote: { type: "string" },
              author: { type: "string" },
              role: { type: "string" },
              avatar: { type: "string" },
              rating: { type: "number" },
            },
            required: ["quote", "author"],
          },
        },
        layout: { type: "string", enum: ["grid", "carousel"] },
        columns: { type: "number" },
      },
    },
    defaults: {
      title: "What Our Customers Say",
      layout: "carousel",
      columns: 3,
      items: [],
    },
    minGridSpan: { cols: 12, rows: 3 },
  },

  faq_accordion: {
    type: "faq_accordion",
    label: "FAQ Accordion",
    description: "Expandable Q&A sections for policies and support",
    icon: HelpCircle,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
          },
        },
        style: { type: "string", enum: ["default", "minimal", "borders"] },
      },
    },
    defaults: {
      title: "Frequently Asked Questions",
      style: "default",
      items: [
        { question: "Do you offer cash on delivery?", answer: "Yes! We offer cash on delivery across Pakistan." },
        { question: "What are your delivery times?", answer: "Standard delivery takes 3-5 business days. Express delivery available in major cities." },
      ],
    },
    minGridSpan: { cols: 10, rows: 3 },
  },

  stats_kpi: {
    type: "stats_kpi",
    label: "Stats / KPI",
    description: "Number statistics with labels — delivery count, years in business, etc.",
    icon: Star,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string" },
              suffix: { type: "string" },
              prefix: { type: "string" },
            },
            required: ["label", "value"],
          },
        },
        columns: { type: "number" },
      },
    },
    defaults: {
      title: "Why Choose Us",
      columns: 4,
      items: [
        { label: "Happy Customers", value: "10,000+", suffix: "+" },
        { label: "Products", value: "500+" },
        { label: "Cities Covered", value: "100+" },
        { label: "Years Experience", value: "5+" },
      ],
    },
    minGridSpan: { cols: 12, rows: 2 },
  },

  newsletter_signup: {
    type: "newsletter_signup",
    label: "Newsletter Signup",
    description: "Email capture form with heading and description",
    icon: Mail,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        placeholder: { type: "string" },
        buttonLabel: { type: "string" },
        successMessage: { type: "string" },
        background: { type: "string" },
      },
    },
    defaults: {
      title: "Stay in the Loop",
      subtitle: "Subscribe for new arrivals, exclusive deals and style tips",
      placeholder: "Your email address",
      buttonLabel: "Subscribe",
      successMessage: "Thanks for subscribing! Check your inbox to confirm.",
      background: "#f9fafb",
    },
    minGridSpan: { cols: 8, rows: 2 },
  },

  blog_preview: {
    type: "blog_preview",
    label: "Blog Preview",
    description: "Latest posts or news articles grid",
    icon: Newspaper,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        limit: { type: "number" },
        showDate: { type: "boolean" },
        showExcerpt: { type: "boolean" },
        columns: { type: "number" },
      },
    },
    defaults: {
      title: "Latest News",
      subtitle: "Tips, trends and updates from our team",
      limit: 3,
      showDate: true,
      showExcerpt: true,
      columns: 3,
    },
    minGridSpan: { cols: 12, rows: 3 },
    allowedKinds: ["blog", "landing", "homepage"],
  },

  // ── Media ────────────────────────────────────────────────────────────────
  image_text: {
    type: "image_text",
    label: "Image + Text",
    description: "Side-by-side image with rich text content",
    icon: Image,
    category: "media",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        imageUrl: { type: ["string", "null"] },
        imageAlt: { type: "string" },
        layout: { type: "string", enum: ["image_left", "image_right", "image_full"] },
        cta: ctaSchema,
      },
    },
    defaults: {
      title: "Our Story",
      body: "Share your brand's journey and values with your customers.",
      layout: "image_right",
    },
    minGridSpan: { cols: 10, rows: 3 },
  },

  video_section: {
    type: "video_section",
    label: "Video Section",
    description: "Background video or embedded video player with text overlay",
    icon: Video,
    category: "media",
    schema: {
      type: "object",
      properties: {
        videoUrl: { type: "string" },
        posterUrl: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        cta: ctaSchema,
        layout: { type: "string", enum: ["background", "contained", "fullscreen"] },
        autoplay: { type: "boolean" },
        loop: { type: "boolean" },
        muted: { type: "boolean" },
      },
    },
    defaults: {
      title: "See Our Collection",
      layout: "background",
      autoplay: true,
      loop: true,
      muted: true,
    },
    minGridSpan: { cols: 12, rows: 4 },
  },

  instagram_feed: {
    type: "instagram_feed",
    label: "Instagram Feed",
    description: "Social media image grid (mock or real API integration)",
    icon: Camera,
    category: "social",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        imageUrls: { type: "array", items: { type: "string" } },
        columns: { type: "number" },
        showLabel: { type: "boolean" },
        label: { type: "string" },
      },
    },
    defaults: {
      title: "Follow Us on Instagram",
      imageUrls: [],
      columns: 6,
      showLabel: true,
      label: "@yourstore",
    },
    minGridSpan: { cols: 12, rows: 2 },
  },

  // ── Marketing ────────────────────────────────────────────────────────────
  trust_badges: {
    type: "trust_badges",
    label: "Trust Badges",
    description: "Icon + text badges for shipping, returns, COD, etc.",
    icon: Star,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        badges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              icon: { type: "string" },
              label: { type: "string" },
              description: { type: "string" },
            },
            required: ["label"],
          },
        },
        layout: { type: "string", enum: ["row", "grid"] },
        columns: { type: "number" },
      },
    },
    defaults: {
      title: "",
      layout: "row",
      columns: 4,
      badges: [
        { icon: "truck", label: "Free Delivery", description: "On orders above Rs. 1,500" },
        { icon: "refresh", label: "Easy Returns", description: "7-day hassle-free returns" },
        { icon: "shield", label: "Authentic Products", description: "100% genuine items only" },
        { icon: "wallet", label: "Cash on Delivery", description: "Pay when you receive" },
      ],
    },
    minGridSpan: { cols: 12, rows: 1 },
  },

  promo_strip: {
    type: "promo_strip",
    label: "Promo Strip",
    description: "Full-width colored strip with bold headline and CTA",
    icon: Megaphone,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        eyebrow: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        cta: ctaSchema,
        background: { type: "string" },
        gradientFrom: { type: "string" },
        gradientTo: { type: "string" },
      },
    },
    defaults: {
      eyebrow: "SUMMER SALE",
      title: "Up to 50% OFF",
      subtitle: "COD available · Free delivery on Rs. 1500+",
      background: "#111111",
    },
    minGridSpan: { cols: 12, rows: 2 },
    allowedKinds: ["homepage", "campaign"],
  },

  whatsapp_cta: {
    type: "whatsapp_cta",
    label: "WhatsApp CTA",
    description: "Floating WhatsApp chat button or inline CTA section",
    icon: MessageCircle,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        phone: { type: "string" },
        message: { type: "string" },
        label: { type: "string" },
        position: { type: "string", enum: ["floating", "inline"] },
        background: { type: "string" },
      },
    },
    defaults: {
      phone: "",
      message: "Assalam o Alaikum! I'm interested in your products.",
      label: "Chat on WhatsApp",
      position: "floating",
      background: "#25D366",
    },
    minGridSpan: { cols: 6, rows: 1 },
  },

  influencer_promo: {
    type: "influencer_promo",
    label: "Influencer Promo",
    description: "Influencer endorsement section with product grid",
    icon: UserPlus,
    category: "marketing",
    schema: {
      type: "object",
      properties: {
        influencerName: { type: "string" },
        influencerHandle: { type: "string" },
        avatarUrl: { type: "string" },
        quote: { type: "string" },
        productIds: { type: "array", items: { type: "string" } },
        background: { type: "string" },
      },
    },
    defaults: {
      influencerName: "Sarah Khan",
      influencerHandle: "@sarahkhan",
      quote: "I've been using these products for months and I'm obsessed!",
      background: "#fef3c7",
    },
    minGridSpan: { cols: 12, rows: 3 },
    allowedKinds: ["homepage", "influencer"],
  },

  custom_html: {
    type: "custom_html",
    label: "Custom HTML",
    description: "Embed custom HTML, scripts or third-party widgets",
    icon: Code2,
    category: "utility",
    schema: {
      type: "object",
      properties: {
        html: { type: "string" },
        css: { type: "string" },
        containerClass: { type: "string" },
      },
    },
    defaults: {
      html: "",
      css: "",
      containerClass: "",
    },
    minGridSpan: { cols: 8, rows: 2 },
  },

  contact_info: {
    type: "contact_info",
    label: "Contact Info",
    description: "Store contact details, address, social links and map embed",
    icon: Smartphone,
    category: "utility",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        whatsapp: { type: "string" },
        mapEmbedUrl: { type: "string" },
        socialLinks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              platform: { type: "string" },
              url: { type: "string" },
            },
          },
        },
      },
    },
    defaults: {
      title: "Get in Touch",
      address: "",
      phone: "",
      email: "",
      whatsapp: "",
      mapEmbedUrl: "",
    },
    minGridSpan: { cols: 8, rows: 3 },
    allowedKinds: ["landing", "custom", "homepage"],
  },

  team_section: {
    type: "team_section",
    label: "Team / About",
    description: "Team member cards or brand story section",
    icon: Users,
    category: "content",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        members: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              bio: { type: "string" },
              avatarUrl: { type: "string" },
            },
            required: ["name", "role"],
          },
        },
        columns: { type: "number" },
      },
    },
    defaults: {
      title: "Meet Our Team",
      columns: 3,
      members: [],
    },
    minGridSpan: { cols: 10, rows: 3 },
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export const BLOCK_TYPES = Object.keys(BLOCK_REGISTRY) as BlockType[];

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_REGISTRY[type] ?? BLOCK_REGISTRY["rich_text"];
}

export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_TYPES.map((t) => BLOCK_REGISTRY[t]).filter((b) => b.category === category);
}

export const BLOCK_CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: "layout", label: "Layout" },
  { id: "commerce", label: "Commerce" },
  { id: "content", label: "Content" },
  { id: "media", label: "Media" },
  { id: "marketing", label: "Marketing" },
  { id: "social", label: "Social" },
  { id: "utility", label: "Utility" },
];
