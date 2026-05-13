import { z } from "zod";

/** CTA link used in hero / promo blocks */
const ctaSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  href: z.string().min(1).max(2048).optional(),
});

const blockBase = z.object({
  id: z.string().min(1).max(64),
  enabled: z.boolean().default(true),
  showOnDesktop: z.boolean().default(true),
  showOnMobile: z.boolean().default(true),
});

const heroBlockSchema = blockBase.extend({
  type: z.literal("hero"),
  settings: z
    .object({
      badge: z.string().max(200).optional(),
      title: z.string().min(1).max(500).optional(),
      subtitle: z.string().max(2000).optional(),
      imageUrl: z.string().max(2048).optional().nullable(),
      videoUrl: z.string().max(2048).optional().nullable(),
      primaryCta: ctaSchema.optional(),
      secondaryCta: ctaSchema.optional(),
    })
    .default({}),
});

const categoryRowBlockSchema = blockBase.extend({
  type: z.literal("category_row"),
  settings: z
    .object({
      /** When "default", storefront uses static category list */
      source: z.enum(["default", "custom"]).default("default"),
    })
    .default({ source: "default" }),
});

const promoStripBlockSchema = blockBase.extend({
  type: z.literal("promo_strip"),
  settings: z
    .object({
      eyebrow: z.string().max(120).optional(),
      title: z.string().min(1).max(500).optional(),
      subtitle: z.string().max(1000).optional(),
      cta: ctaSchema.optional(),
      background: z.enum(["gradient_blue", "gradient_dark", "solid"]).optional(),
    })
    .default({}),
});

const featuredBlockSchema = blockBase.extend({
  type: z.literal("featured_products"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      subtitle: z.string().max(500).optional(),
      limit: z.number().int().min(1).max(24).optional(),
    })
    .default({}),
});

const collectionShowcaseBlockSchema = blockBase.extend({
  type: z.literal("collection_showcase"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      subtitle: z.string().max(500).optional(),
    })
    .default({}),
});

const trustBadgesBlockSchema = blockBase.extend({
  type: z.literal("trust_badges"),
  settings: z.object({}).default({}),
});

const marketingBannerBlockSchema = blockBase.extend({
  type: z.literal("marketing_banner"),
  settings: z
    .object({
      eyebrow: z.string().max(120).optional(),
      title: z.string().max(300).optional(),
      subtitle: z.string().max(500).optional(),
      imageUrl: z.string().max(2048).optional().nullable(),
      cta: ctaSchema.optional(),
      tone: z.enum(["light", "dark"]).optional(),
    })
    .default({}),
});

const testimonialsBlockSchema = blockBase.extend({
  type: z.literal("testimonials"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      items: z
        .array(
          z.object({
            quote: z.string().max(500),
            name: z.string().max(120),
            role: z.string().max(120).optional(),
          }),
        )
        .max(12)
        .default([]),
    })
    .default({ items: [] }),
});

const statsKpiBlockSchema = blockBase.extend({
  type: z.literal("stats_kpi"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      items: z
        .array(
          z.object({
            label: z.string().max(80),
            value: z.string().max(40),
          }),
        )
        .max(8)
        .default([]),
    })
    .default({ items: [] }),
});

const newsletterSignupBlockSchema = blockBase.extend({
  type: z.literal("newsletter_signup"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      subtitle: z.string().max(500).optional(),
      placeholder: z.string().max(120).optional(),
      buttonLabel: z.string().max(80).optional(),
    })
    .default({}),
});

const activityFeedBlockSchema = blockBase.extend({
  type: z.literal("activity_feed"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      lines: z.array(z.string().max(200)).max(12).default([]),
    })
    .default({ lines: [] }),
});

const blogTeaserBlockSchema = blockBase.extend({
  type: z.literal("blog_teaser"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      subtitle: z.string().max(500).optional(),
      posts: z
        .array(
          z.object({
            title: z.string().max(200),
            href: z.string().max(2048),
          }),
        )
        .max(8)
        .default([]),
    })
    .default({ posts: [] }),
});

const richTextBlockSchema = blockBase.extend({
  type: z.literal("rich_text"),
  settings: z
    .object({
      title: z.string().max(200).optional(),
      body: z.string().max(8000).optional(),
    })
    .default({}),
});

export const homeBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  trustBadgesBlockSchema,
  categoryRowBlockSchema,
  featuredBlockSchema,
  collectionShowcaseBlockSchema,
  promoStripBlockSchema,
  marketingBannerBlockSchema,
  testimonialsBlockSchema,
  statsKpiBlockSchema,
  newsletterSignupBlockSchema,
  activityFeedBlockSchema,
  blogTeaserBlockSchema,
  richTextBlockSchema,
]);

/** Top-level document stored in `store_pages.home_blocks` (preferred) */
export const homePageContentSchema = z.object({
  version: z.literal(1).default(1),
  blocks: z.array(homeBlockSchema).max(40),
});

/** Legacy: array of blocks only */
export const homeBlocksArraySchema = z.array(homeBlockSchema);

export type HomeBlockInput = z.infer<typeof homeBlockSchema>;
export type HomePageContent = z.infer<typeof homePageContentSchema>;
