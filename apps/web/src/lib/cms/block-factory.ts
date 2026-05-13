/**
 * CMS block instance factory — creates validated block instances from registry defaults.
 * Also handles duplications, patches, and block type validation.
 */
import { nanoid } from "nanoid";
import { BLOCK_REGISTRY, getBlockDefinition, type BlockType } from "./block-registry";

export interface CmsBlock {
  id: string;
  blockType: BlockType;
  definitionId?: string;
  settings: Record<string, unknown>;
  enabled: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  styles?: Record<string, string>;
  sortOrder: number;
}

export interface CmsPage {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  kind: CmsPageKind;
  layout: CmsBlock[];
  publishAt?: string | null;
  isPublished: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  customHead?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CmsPageKind =
  | "homepage"
  | "landing"
  | "campaign"
  | "blog"
  | "policy"
  | "influencer"
  | "custom";

export interface CmsRevision {
  id: string;
  pageId: string;
  layoutSnapshot: CmsBlock[];
  type: "autosave" | "draft" | "published";
  createdAt: string;
}

// ── Factory ─────────────────────────────────────────────────────────────────────

export function createBlock(type: BlockType, overrides?: Partial<CmsBlock>): CmsBlock {
  const def = getBlockDefinition(type);
  return {
    id: nanoid(),
    blockType: type,
    definitionId: undefined,
    settings: { ...def.defaults, ...(overrides?.settings ?? {}) },
    enabled: true,
    showOnDesktop: true,
    showOnMobile: true,
    styles: overrides?.styles ?? {},
    sortOrder: overrides?.sortOrder ?? 0,
    ...overrides,
  };
}

export function duplicateBlock(block: CmsBlock): CmsBlock {
  return {
    ...block,
    id: nanoid(),
    settings: { ...block.settings },
    styles: block.styles ? { ...block.styles } : undefined,
  };
}

export function patchBlock(
  blocks: CmsBlock[],
  id: string,
  patch: Partial<CmsBlock>,
): CmsBlock[] {
  return blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
}

export function removeBlock(blocks: CmsBlock[], id: string): CmsBlock[] {
  return blocks.filter((b) => b.id !== id);
}

export function reorderBlocks(blocks: CmsBlock[], fromIndex: number, toIndex: number): CmsBlock[] {
  const result = [...blocks];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result.map((b, i) => ({ ...b, sortOrder: i }));
}

export function validateLayout(blocks: unknown[]): blocks is CmsBlock[] {
  if (!Array.isArray(blocks)) return false;
  return blocks.every(
    (b) =>
      b &&
      typeof b === "object" &&
      typeof (b as Record<string, unknown>).id === "string" &&
      typeof (b as Record<string, unknown>).blockType === "string" &&
      typeof (b as Record<string, unknown>).settings === "object",
  );
}

export function createPage(
  storeId: string,
  title: string,
  slug: string,
  kind: CmsPageKind = "custom",
): Omit<CmsPage, "id" | "createdAt" | "updatedAt"> {
  return {
    storeId,
    title,
    slug,
    kind,
    layout: [],
    isPublished: false,
  };
}

// ── Default page templates ───────────────────────────────────────────────────

export function getHomepageTemplate(): CmsBlock[] {
  return [
    createBlock("announcement_bar", { sortOrder: 0 }),
    createBlock("hero", { sortOrder: 1 }),
    createBlock("trust_badges", { sortOrder: 2 }),
    createBlock("category_slider", { sortOrder: 3 }),
    createBlock("featured_products", { sortOrder: 4, settings: { title: "Featured Products", subtitle: "Handpicked for you", limit: 4, columns: 4, source: "featured" } }),
    createBlock("promo_strip", { sortOrder: 5 }),
    createBlock("collection_showcase", { sortOrder: 6 }),
    createBlock("newsletter_signup", { sortOrder: 7 }),
  ];
}

export function getLandingTemplate(): CmsBlock[] {
  return [
    createBlock("hero", { sortOrder: 0 }),
    createBlock("trust_badges", { sortOrder: 1 }),
    createBlock("product_grid", { sortOrder: 2 }),
    createBlock("faq_accordion", { sortOrder: 3 }),
    createBlock("newsletter_signup", { sortOrder: 4 }),
  ];
}

export function getCampaignTemplate(): CmsBlock[] {
  return [
    createBlock("announcement_bar", { sortOrder: 0 }),
    createBlock("hero", { sortOrder: 1 }),
    createBlock("deal_countdown", { sortOrder: 2 }),
    createBlock("flash_sale", { sortOrder: 3 }),
    createBlock("featured_products", { sortOrder: 4 }),
    createBlock("testimonials", { sortOrder: 5 }),
    createBlock("faq_accordion", { sortOrder: 6 }),
    createBlock("whatsapp_cta", { sortOrder: 7 }),
  ];
}

export function getPolicyPageTemplate(): CmsBlock[] {
  return [
    createBlock("rich_text", { sortOrder: 0 }),
    createBlock("faq_accordion", { sortOrder: 1 }),
  ];
}

export function getTemplateForKind(kind: CmsPageKind): CmsBlock[] {
  switch (kind) {
    case "homepage": return getHomepageTemplate();
    case "landing": return getLandingTemplate();
    case "campaign": return getCampaignTemplate();
    case "policy": return getPolicyPageTemplate();
    default: return [];
  }
}
