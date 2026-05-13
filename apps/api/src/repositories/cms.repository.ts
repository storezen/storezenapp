import { and, eq, sql } from "drizzle-orm";
import { db, cmsPagesTable, cmsPageBlocksTable, cmsRevisionsTable } from "../db";
import type { CmsLayout } from "../db/schema";
import { randomUUID } from "node:crypto";

export async function listCmsPages(storeId: string) {
  return db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.storeId, storeId))
    .orderBy(sql`${cmsPagesTable.updatedAt} desc`);
}

export async function findCmsPageById(pageId: string) {
  const [page] = await db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.id, pageId))
    .limit(1);
  return page ?? null;
}

export async function findCmsPageBySlug(storeId: string, slug: string) {
  const [page] = await db
    .select()
    .from(cmsPagesTable)
    .where(and(eq(cmsPagesTable.storeId, storeId), eq(cmsPagesTable.slug, slug)))
    .limit(1);
  return page ?? null;
}

export async function findPublishedPageBySlug(storeId: string, slug: string) {
  const [page] = await db
    .select()
    .from(cmsPagesTable)
    .where(and(
      eq(cmsPagesTable.storeId, storeId),
      eq(cmsPagesTable.slug, slug),
      eq(cmsPagesTable.isPublished, true),
    ))
    .limit(1);
  return page ?? null;
}

export async function listPagesByStore(
  storeId: string,
  opts: { includeUnpublished?: boolean } = {},
) {
  const whereClause = opts.includeUnpublished
    ? eq(cmsPagesTable.storeId, storeId)
    : and(eq(cmsPagesTable.storeId, storeId), eq(cmsPagesTable.isPublished, true));
  return db
    .select()
    .from(cmsPagesTable)
    .where(whereClause)
    .orderBy(sql`${cmsPagesTable.updatedAt} desc`);
}

export async function createCmsPage(data: {
  storeId: string;
  title: string;
  slug: string;
  kind: string;
  layout?: CmsLayout;
}) {
  const [page] = await db
    .insert(cmsPagesTable)
    .values({
      id: randomUUID(),
      storeId: data.storeId,
      title: data.title,
      slug: data.slug,
      kind: data.kind,
      layout: data.layout ?? [],
      isPublished: false,
    })
    .returning();
  return page;
}

export async function updateCmsPage(
  pageId: string,
  data: Partial<{
    title: string;
    slug: string;
    kind: string;
    layout: unknown[];
    isPublished: boolean;
    publishAt: Date | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoImage: string | null;
    customHead: string | null;
  }>,
) {
  const [page] = await db
    .update(cmsPagesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(cmsPagesTable.id, pageId))
    .returning();
  return page ?? null;
}

export async function deleteCmsPage(pageId: string) {
  await db.delete(cmsPagesTable).where(eq(cmsPagesTable.id, pageId));
}

export async function publishCmsPage(pageId: string) {
  const [page] = await db
    .update(cmsPagesTable)
    .set({ isPublished: true, updatedAt: new Date() })
    .where(eq(cmsPagesTable.id, pageId))
    .returning();
  return page ?? null;
}

export async function saveCmsRevision(
  pageId: string,
  layout: CmsLayout,
  type: "autosave" | "draft" | "published" = "autosave",
) {
  const [revision] = await db
    .insert(cmsRevisionsTable)
    .values({
      id: randomUUID(),
      pageId,
      layoutSnapshot: layout,
      type,
    })
    .returning();
  return revision;
}

export async function listCmsRevisions(pageId: string, limit = 20) {
  return db
    .select()
    .from(cmsRevisionsTable)
    .where(eq(cmsRevisionsTable.pageId, pageId))
    .orderBy(sql`${cmsRevisionsTable.createdAt} desc`)
    .limit(limit);
}

export async function listCmsSnippets(storeId: string) {
  return db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.storeId, storeId));
}

export async function listCmsTemplates(storeId: string) {
  return db
    .select()
    .from(cmsPagesTable)
    .where(eq(cmsPagesTable.storeId, storeId));
}

export async function findCmsRevisionById(revisionId: string) {
  const [rev] = await db
    .select()
    .from(cmsRevisionsTable)
    .where(eq(cmsRevisionsTable.id, revisionId))
    .limit(1);
  return rev ?? null;
}

export async function restoreCmsRevision(revisionId: string) {
  const revision = await findCmsRevisionById(revisionId);
  if (!revision) return null;
  const [page] = await db
    .update(cmsPagesTable)
    .set({ layout: revision.layoutSnapshot as CmsLayout, updatedAt: new Date() })
    .where(eq(cmsPagesTable.id, revision.pageId))
    .returning();
  return page ?? null;
}

export const cmsRepository = {
  listCmsPages,
  findCmsPageById,
  findCmsPageBySlug,
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
  publishCmsPage,
  saveCmsRevision,
  listCmsRevisions,
  findPublishedPageBySlug,
  listPagesByStore,
  findCmsRevisionById,
  restoreCmsRevision,
};
