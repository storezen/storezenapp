/* ── Coupon types ────────────────────────────────────────────────────────── */
export type DiscountType = 'percentage' | 'fixed' | 'free_delivery';

export type Coupon = {
  code:              string;
  discount_type:     DiscountType;
  discount_value:    number;       // percentage: 10 = 10%, fixed: 200 = Rs. 200
  min_order_amount:  number;       // minimum subtotal required
  max_uses:          number;       // 0 = unlimited
  expiry_date:       string | null;// ISO date string or null
  active:            boolean;
  description:       string;
  max_discount?:     number;       // cap for percentage discounts (Rs.)
  first_order_only?: boolean;      // restrict to first-time customers
};

/* ── Starter coupons ────────────────────────────────────────────────────── */
export const COUPONS: Coupon[] = [
  {
    code:             'FIRST10',
    discount_type:    'percentage',
    discount_value:   10,
    min_order_amount: 1000,
    max_uses:         0,
    expiry_date:      null,
    active:           true,
    description:      '10% off on orders over Rs. 1,000',
  },
  {
    code:             'SAVE200',
    discount_type:    'fixed',
    discount_value:   200,
    min_order_amount: 2000,
    max_uses:         0,
    expiry_date:      null,
    active:           true,
    description:      'Rs. 200 off on orders over Rs. 2,000',
  },
  {
    code:             'FREEDELIVERY',
    discount_type:    'free_delivery',
    discount_value:   0,
    min_order_amount: 1500,
    max_uses:         0,
    expiry_date:      null,
    active:           true,
    description:      'Free delivery on orders over Rs. 1,500',
  },
  {
    code:             'WELCOME15',
    discount_type:    'percentage',
    discount_value:   15,
    min_order_amount: 0,
    max_uses:         1,
    expiry_date:      null,
    active:           true,
    description:      '15% off for your first order (max Rs. 500)',
    max_discount:     500,
    first_order_only: true,
  },
];

/* ── Usage tracking in localStorage ────────────────────────────────────── */
const COUPON_USES_KEY = 'sw_coupon_uses';

function getCouponUses(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COUPON_USES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch { return {}; }
}

export function applyCouponUsage(code: string): void {
  try {
    const uses = getCouponUses();
    const key  = code.toUpperCase();
    uses[key]  = (uses[key] ?? 0) + 1;
    localStorage.setItem(COUPON_USES_KEY, JSON.stringify(uses));
  } catch { /* quota errors ignored */ }
}

function getUsageCount(code: string): number {
  return getCouponUses()[code.toUpperCase()] ?? 0;
}

/* ── Validation ─────────────────────────────────────────────────────────── */
export type ValidationResult =
  | { valid: true;  coupon: Coupon }
  | { valid: false; error: string };

export function validateCoupon(code: string, subtotal: number): ValidationResult {
  const coupon = COUPONS.find(c => c.code === code.trim().toUpperCase());

  if (!coupon)
    return { valid: false, error: 'Invalid coupon code. Please check and try again.' };

  if (!coupon.active)
    return { valid: false, error: 'This coupon is no longer active.' };

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date())
    return { valid: false, error: 'This coupon has expired.' };

  if (subtotal < coupon.min_order_amount)
    return {
      valid: false,
      error: `Minimum order Rs. ${coupon.min_order_amount.toLocaleString()} required for this coupon.`,
    };

  if (coupon.max_uses > 0 && getUsageCount(code) >= coupon.max_uses) {
    if (coupon.first_order_only) {
      return { valid: false, error: 'This coupon is for first-time orders only.' };
    }
    return { valid: false, error: 'This coupon has reached its usage limit.' };
  }

  if (coupon.first_order_only) {
    try {
      const orders = JSON.parse(localStorage.getItem('sw_orders') ?? '[]') as unknown[];
      if (orders.length > 0)
        return { valid: false, error: 'This coupon is valid for first-time orders only.' };
    } catch { /* ignore */ }
  }

  return { valid: true, coupon };
}

/* ── Discount calculation ───────────────────────────────────────────────── */
export type DiscountResult = {
  discount:       number;  // total amount saved in Rs.
  finalDelivery:  number;  // delivery charge after coupon
};

export function calculateDiscount(
  coupon: Coupon,
  subtotal: number,
  deliveryCharge: number,
): DiscountResult {
  switch (coupon.discount_type) {
    case 'percentage': {
      let discount = Math.round(subtotal * coupon.discount_value / 100);
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
      return { discount, finalDelivery: deliveryCharge };
    }
    case 'fixed': {
      return { discount: Math.min(coupon.discount_value, subtotal), finalDelivery: deliveryCharge };
    }
    case 'free_delivery': {
      return { discount: deliveryCharge, finalDelivery: 0 };
    }
    default:
      return { discount: 0, finalDelivery: deliveryCharge };
  }
}
