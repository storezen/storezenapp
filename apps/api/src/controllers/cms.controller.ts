import { type Request, type Response } from "express";
import { z } from "zod";
import type { CmsLayout } from "../db/schema";
import {
  listCmsPages,
  findCmsPageById,
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
  publishCmsPage,
  saveCmsRevision,
  listCmsRevisions,
  restoreCmsRevision,
  findCmsRevisionById,
} from "../services/cms.service";

export function toParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

const createPageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).max(100),
  kind: z.enum(["homepage", "landing", "campaign", "blog", "policy", "influencer", "custom"]).default("custom"),
  layout: z.array(z.unknown()).optional(),
});

const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).max(100).optional(),
  kind: z.enum(["homepage", "landing", "campaign", "blog", "policy", "influencer", "custom"]).optional(),
  layout: z.array(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  publishAt: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoImage: z.string().nullable().optional(),
  customHead: z.string().nullable().optional(),
});

export async function listCmsPagesController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pages = await listCmsPages(req.user.storeId);
    return res.json({ pages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load pages";
    return res.status(500).json({ error: msg });
  }
}

export async function getCmsPageController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pageId = toParam(req.params.id);
    const page = await findCmsPageById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (page.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });
    return res.json(page);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load page";
    return res.status(500).json({ error: msg });
  }
}

export async function createCmsPageController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = createPageSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).join(", ");
      return res.status(400).json({ error: issues });
    }
    const page = await createCmsPage({
      storeId: req.user.storeId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      kind: parsed.data.kind,
      layout: parsed.data.layout as CmsLayout | undefined,
    });
    return res.status(201).json(page);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create page";
    return res.status(500).json({ error: msg });
  }
}

export async function updateCmsPageController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pageId = toParam(req.params.id);
    const page = await findCmsPageById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (page.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });

    const parsed = updatePageSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).join(", ");
      return res.status(400).json({ error: issues });
    }

    const updated = await updateCmsPage(pageId, {
      ...parsed.data,
      layout: parsed.data.layout as CmsLayout | undefined,
      publishAt: parsed.data.publishAt ? new Date(parsed.data.publishAt) : undefined,
    });
    if (!updated) return res.status(404).json({ error: "Page not found" });

    if (parsed.data.layout) {
      try {
        await saveCmsRevision(pageId, parsed.data.layout as CmsLayout, "autosave");
      } catch { /* ignore */ }
    }

    return res.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update page";
    return res.status(500).json({ error: msg });
  }
}

export async function deleteCmsPageController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pageId = toParam(req.params.id);
    const page = await findCmsPageById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (page.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });
    await deleteCmsPage(pageId);
    return res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete page";
    return res.status(500).json({ error: msg });
  }
}

export async function publishCmsPageController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pageId = toParam(req.params.id);
    const page = await findCmsPageById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (page.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });
    const published = await publishCmsPage(pageId);
    if (!published) return res.status(404).json({ error: "Page not found" });
    return res.json(published);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to publish page";
    return res.status(500).json({ error: msg });
  }
}

export async function listCmsRevisionsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pageId = toParam(req.params.id);
    const page = await findCmsPageById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (page.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });
    const revisions = await listCmsRevisions(pageId);
    return res.json({ revisions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load revisions";
    return res.status(500).json({ error: msg });
  }
}

export async function restoreCmsRevisionController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const pageId = toParam(req.params.id);
    const revisionId = toParam(req.params.revisionId);
    const page = await findCmsPageById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (page.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });
    const restored = await restoreCmsRevision(revisionId);
    if (!restored) return res.status(404).json({ error: "Revision not found" });
    return res.json(restored);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to restore revision";
    return res.status(500).json({ error: msg });
  }
}
