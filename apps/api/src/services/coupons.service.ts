import { randomUUID } from "node:crypto";
import {
  createCoupon,
  deleteCoupon,
  findCouponByCode,
  findCouponById,
  listCouponsByStore,
  updateCoupon,
} from "../repositories/coupons.repository";
import { findStoreBySlug } from "../repositories/stores.repository";

export async function createStoreCoupon(
  storeId: string,
  data: {
    code: string;
    type: "percent" | "fixed" | "free_delivery";
    value: number;
    minOrder?: number;
    usageLimit?: number;
    isActive?: boolean;
    expiresAt?: string;
  },
) {
  return createCoupon({
    id: randomUUID(),
    storeId,
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: String(data.value),
    minOrder: String(data.minOrder ?? 0),
    usageLimit: data.usageLimit,
    usedCount: 0,
    isActive: data.isActive ?? true,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
  });
}

export async function getStoreCoupons(storeId: string) {
  return listCouponsByStore(storeId);
}

export async function updateStoreCoupon(
  storeId: string,
  couponId: string,
  data: Partial<{
    code: string;
    type: "percent" | "fixed" | "free_delivery";
    value: number;
    minOrder: number;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    expiresAt: string | null;
  }>,
) {
  const existing = await findCouponById(couponId);
  if (!existing) throw new Error("NotFound");
  if (existing.storeId !== storeId) throw new Error("Forbidden");

  return updateCoupon(couponId, {
    code: data.code?.trim().toUpperCase(),
    type: data.type,
    value: data.value != null ? String(data.value) : undefined,
    minOrder: data.minOrder != null ? String(data.minOrder) : undefined,
    usageLimit: data.usageLimit ?? undefined,
    usedCount: data.usedCount,
    isActive: data.isActive,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === null ? null : undefined,
  });
}

export async function deleteStoreCoupon(storeId: string, couponId: string) {
  const existing = await findCouponById(couponId);
  if (!existing) throw new Error("NotFound");
  if (existing.storeId !== storeId) throw new Error("Forbidden");
  return deleteCoupon(couponId);
}

export async function validateCoupon(params: { code: string; storeSlug: string; total: number }) {
  const store = await findStoreBySlug(params.storeSlug);
  if (!store) throw new Error("StoreNotFound");

  const coupon = await findCouponByCode(store.id, params.code.trim().toUpperCase());
  if (!coupon) throw new Error("InvalidCoupon");
  if (!coupon.isActive) throw new Error("CouponInactive");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("CouponExpired");
  if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit) throw new Error("CouponUsageLimitReached");
  if (params.total < Number(coupon.minOrder ?? 0)) throw new Error("CouponMinOrderNotMet");

  let discount = 0;
  if (coupon.type === "percent") discount = (params.total * Number(coupon.value)) / 100;
  if (coupon.type === "fixed") discount = Number(coupon.value);
  if (coupon.type === "free_delivery") discount = 0;

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minOrder: Number(coupon.minOrder ?? 0),
    },
    discount: Math.max(0, Math.min(discount, params.total)),
  };
}

