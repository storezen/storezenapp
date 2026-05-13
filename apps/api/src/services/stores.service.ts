import { parseAndValidateHomePageBody, resolveHomePageFromDb } from "../lib/home-page";
import {
  buildStoreAnalytics,
  createCampaign,
  deleteCampaign,
  listCampaignsByStore,
  updateCampaign,
} from "../repositories/analytics.repository";
import {
  findStoreBySlug,
  findStoreByUserId,
  getStorePages,
  getStoreStats,
  updateStoreById,
  upsertStorePages,
} from "../repositories/stores.repository";

function assertStore(userId: string) {
  return findStoreByUserId(userId);
}

export async function getPublicStore(slug: string) {
  const store = await findStoreBySlug(slug);
  if (!store || !store.isActive) return null;

  const pages = await getStorePages(store.id);
  const homePage = resolveHomePageFromDb(pages?.homeBlocks ?? null);

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    logo: store.logo,
    theme: store.theme,
    themeColors: store.themeColors,
    tiktokPixel: store.tiktokPixel,
    metaPixel: store.metaPixel,
    whatsappNumber: store.whatsappNumber,
    deliverySettings: store.deliverySettings,
    paymentMethods: store.paymentMethods,
    isActive: store.isActive,
    homePage,
  };
}

export async function getMyStore(userId: string) {
  return assertStore(userId);
}

export async function updateMyStore(userId: string, data: { name?: string; logo?: string; whatsappNumber?: string }) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return updateStoreById(store.id, data);
}

export async function updateStoreTheme(userId: string, data: { theme?: string; themeColors?: unknown }) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return updateStoreById(store.id, { theme: data.theme, themeColors: data.themeColors });
}

export async function updateStorePixel(userId: string, data: { tiktokPixel?: string; metaPixel?: string }) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return updateStoreById(store.id, { tiktokPixel: data.tiktokPixel, metaPixel: data.metaPixel });
}

export async function updateStoreDelivery(userId: string, deliverySettings: unknown) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return updateStoreById(store.id, { deliverySettings });
}

export async function updateStorePayment(userId: string, paymentMethods: unknown) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return updateStoreById(store.id, { paymentMethods });
}

export async function updateStorePages(userId: string, body: unknown) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  const homePage = parseAndValidateHomePageBody(body);
  await upsertStorePages(store.id, homePage);
  return getStorePages(store.id);
}

export async function getMyStoreStats(userId: string) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  const stats = await getStoreStats(store.id);
  const pages = await getStorePages(store.id);
  return { storeId: store.id, stats, pages };
}

export async function getMyStorePages(userId: string) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  const row = await getStorePages(store.id);
  return {
    homePage: resolveHomePageFromDb(row?.homeBlocks ?? null),
    updatedAt: row?.updatedAt?.toISOString?.() ?? (row?.updatedAt ? String(row.updatedAt) : null),
  };
}

export async function getMyStoreAnalytics(userId: string, days: number) {
  const store = await findStoreByUserId(userId);
  if (!store) throw new Error("StoreNotFound");
  const d = Math.min(Math.max(Math.floor(days) || 30, 1), 90);
  return buildStoreAnalytics(store.id, d);
}

export async function getMyCampaignsList(userId: string) {
  const store = await findStoreByUserId(userId);
  if (!store) throw new Error("StoreNotFound");
  return { campaigns: await listCampaignsByStore(store.id) };
}

export async function addMyCampaign(
  userId: string,
  data: { name: string; channel?: string; status?: string; budget?: string; spend?: string; notes?: string | null },
) {
  const store = await findStoreByUserId(userId);
  if (!store) throw new Error("StoreNotFound");
  return createCampaign(store.id, data);
}

export async function patchMyCampaign(
  userId: string,
  id: string,
  patch: Partial<{
    name: string;
    channel: string;
    status: string;
    budget: string;
    spend: string;
    impressions: number;
    clicks: number;
    conversions: number;
    notes: string | null;
  }>,
) {
  const store = await findStoreByUserId(userId);
  if (!store) throw new Error("StoreNotFound");
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as typeof patch;
  const row = await updateCampaign(store.id, id, clean);
  if (!row) throw new Error("NotFound");
  return row;
}

export async function removeMyCampaign(userId: string, id: string) {
  const store = await findStoreByUserId(userId);
  if (!store) throw new Error("StoreNotFound");
  const row = await deleteCampaign(store.id, id);
  if (!row) throw new Error("NotFound");
  return { ok: true };
}

