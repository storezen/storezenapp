import {
  getAdminStats,
  getPlatformSettings,
  listAdminStores,
  listAdminUsers,
  toggleStoreActive,
  toggleUserBan,
  updatePlatformSettings,
  updateUserPlan,
  updateOwnerPlanByStoreId,
} from "../repositories/admin.repository";

export async function getPlatformStats() {
  return getAdminStats();
}

export async function getStores(params: {
  page?: number;
  search?: string;
  status?: "active" | "inactive";
}) {
  return listAdminStores({
    page: params.page,
    pageSize: 20,
    search: params.search,
    status: params.status,
  });
}

export async function toggleStore(storeId: string) {
  const updated = await toggleStoreActive(storeId);
  if (!updated) throw new Error("StoreNotFound");
  return updated;
}

export async function updateStoreOwnerPlan(storeId: string, plan: string) {
  const updated = await updateOwnerPlanByStoreId(storeId, plan);
  if (!updated) throw new Error("StoreNotFound");
  return updated;
}

export async function getUsers(params: { page?: number; search?: string }) {
  return listAdminUsers({
    page: params.page,
    pageSize: 20,
    search: params.search,
  });
}

export async function toggleUser(userId: string) {
  const updated = await toggleUserBan(userId);
  if (!updated) throw new Error("UserNotFound");
  return updated;
}

export async function updateUserPlanByAdmin(userId: string, plan: string) {
  const updated = await updateUserPlan(userId, plan);
  if (!updated) throw new Error("UserNotFound");
  return updated;
}

export async function getAdminPlatformSettings() {
  return getPlatformSettings();
}

export async function updateAdminPlatformSettings(input: { maintenanceMode?: boolean; settings?: Record<string, unknown> }) {
  return updatePlatformSettings(input);
}

