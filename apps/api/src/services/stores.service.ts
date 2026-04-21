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

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    logo: store.logo,
    theme: store.theme,
    themeColors: store.themeColors,
    tiktokPixel: store.tiktokPixel,
    whatsappNumber: store.whatsappNumber,
    deliverySettings: store.deliverySettings,
    paymentMethods: store.paymentMethods,
    isActive: store.isActive,
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

export async function updateStorePixel(userId: string, data: { tiktokPixel?: string }) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return updateStoreById(store.id, { tiktokPixel: data.tiktokPixel });
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

export async function updateStorePages(userId: string, homeBlocks: unknown[]) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  return upsertStorePages(store.id, homeBlocks);
}

export async function getMyStoreStats(userId: string) {
  const store = await assertStore(userId);
  if (!store) throw new Error("StoreNotFound");
  const stats = await getStoreStats(store.id);
  const pages = await getStorePages(store.id);
  return { storeId: store.id, stats, pages };
}

