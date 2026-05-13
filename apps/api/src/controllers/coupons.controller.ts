import { type Request, type Response } from "express";
import {
  createStoreCoupon,
  deleteStoreCoupon,
  getStoreCoupons,
  updateStoreCoupon,
  validateCoupon,
} from "../services/coupons.service";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponQuerySchema,
} from "../validators/coupons.validator";

function toSingleParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

function requireStoreId(req: Request) {
  if (!req.user?.storeId) throw new Error("Unauthorized");
  return req.user.storeId;
}

export async function createCouponController(req: Request, res: Response) {
  try {
    const storeId = requireStoreId(req);
    const parsed = createCouponSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const coupon = await createStoreCoupon(storeId, parsed.data);
    return res.status(201).json(coupon);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    return res.status(500).json({ error: "Failed to create coupon" });
  }
}

export async function listCouponsController(req: Request, res: Response) {
  try {
    const storeId = requireStoreId(req);
    const coupons = await getStoreCoupons(storeId);
    return res.json({ coupons });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    return res.status(500).json({ error: "Failed to load coupons" });
  }
}

export async function updateCouponController(req: Request, res: Response) {
  try {
    const storeId = requireStoreId(req);
    const couponId = toSingleParam(req.params.id);
    const parsed = updateCouponSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const coupon = await updateStoreCoupon(storeId, couponId, parsed.data);
    return res.json(coupon);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update coupon";
    if (msg === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (msg === "NotFound") return res.status(404).json({ error: "Coupon not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    return res.status(500).json({ error: msg });
  }
}

export async function deleteCouponController(req: Request, res: Response) {
  try {
    const storeId = requireStoreId(req);
    const couponId = toSingleParam(req.params.id);
    await deleteStoreCoupon(storeId, couponId);
    return res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete coupon";
    if (msg === "Unauthorized") return res.status(401).json({ error: "Unauthorized" });
    if (msg === "NotFound") return res.status(404).json({ error: "Coupon not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    return res.status(500).json({ error: msg });
  }
}

export async function validateCouponController(req: Request, res: Response) {
  try {
    const parsed = validateCouponQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { code, store_slug, total } = parsed.data;

    const payload = await validateCoupon({
      code,
      storeSlug: store_slug,
      total,
    });
    return res.json(payload);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to validate coupon";
    if (["StoreNotFound", "InvalidCoupon", "CouponInactive", "CouponExpired", "CouponUsageLimitReached", "CouponMinOrderNotMet"].includes(msg)) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
}

