/* ── WhatsApp Message Templates ──────────────────────────────────────────── */

export interface WaTemplate {
  id: string;
  name: string;
  emoji: string;
  statusHint: string;   // which order status this maps to
  text: string;
}

export type TemplateVars = {
  customer_name: string;
  order_id: string;
  product_name: string;
  total: string;
  delivery_estimate: string;
  tracking_number: string;
  delivery_date: string;
  tracking_url: string;
  review_url: string;
  price: string;
  store_url: string;
  store_name: string;
};

const LS_KEY = 'sw_wa_templates';

export const SAMPLE_VARS: TemplateVars = {
  customer_name:     'Ahmed Khan',
  order_id:          'SW-2026-DEMO1',
  product_name:      'Band T-Shirt (Black, M)',
  total:             '2,999',
  delivery_estimate: '2-3 business days',
  tracking_number:   'TRK98765432',
  delivery_date:     'April 25, 2026',
  tracking_url:      typeof window !== 'undefined' ? `${window.location.origin}/track-order?id=SW-2026-DEMO1` : 'https://smartwear.pk/track-order',
  review_url:        typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://smartwear.pk/',
  price:             '2,999',
  store_url:         typeof window !== 'undefined' ? window.location.origin : 'https://smartwear.pk',
  store_name:        'SmartWear',
};

export const DEFAULT_TEMPLATES: WaTemplate[] = [
  {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    emoji: '✅',
    statusHint: 'confirmed',
    text:
`Assalam o Alaikum {customer_name}! ✅
Your order has been confirmed!
📦 Order: {order_id}
🛍️ Product: {product_name}
💰 Total: Rs. {total}
🚚 Delivery: {delivery_estimate}
We'll update you when your order ships. Thank you for shopping with SmartWear! 🛒`,
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    emoji: '📦',
    statusHint: 'shipped',
    text:
`Hi {customer_name}! 📦
Great news — your order {order_id} has been shipped!
🚚 Tracking: {tracking_number}
📅 Expected delivery: {delivery_date}
Track your order: {tracking_url}
SmartWear — Quality You Can Trust ✨`,
  },
  {
    id: 'out_for_delivery',
    name: 'Out for Delivery',
    emoji: '🚚',
    statusHint: 'out_for_delivery',
    text:
`🚚 {customer_name}, your order is out for delivery!
Order: {order_id}
💵 Amount: Rs. {total} (COD)
Please keep your phone available.
SmartWear Team`,
  },
  {
    id: 'delivered_review',
    name: 'Delivered + Review',
    emoji: '⭐',
    statusHint: 'delivered',
    text:
`✅ {customer_name}, your order {order_id} has been delivered!
We hope you love your {product_name}!
⭐ Leave us a review: {review_url}
📸 Share your photos with #SmartWear
Use code COMEBACK10 for 10% off your next order! 🎉`,
  },
  {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    emoji: '🛒',
    statusHint: 'placed',
    text:
`Hi {customer_name}! 👋
You left some amazing items in your cart!
🛍️ {product_name} — Rs. {price}
Complete your order now and get FREE delivery!
Use code COMPLETE10 for 10% off: {store_url}
SmartWear Team`,
  },
];

/* ── Persistence ─────────────────────────────────────────────────────────── */

export function getTemplates(): WaTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const saved: WaTemplate[] = JSON.parse(raw);
    // Merge: keep all default IDs in order, override text if saved
    return DEFAULT_TEMPLATES.map(def => {
      const override = saved.find(s => s.id === def.id);
      return override ? { ...def, text: override.text } : def;
    });
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: WaTemplate[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(templates));
}

export function resetTemplates(): void {
  localStorage.removeItem(LS_KEY);
}

/* ── Fill ────────────────────────────────────────────────────────────────── */

export function fillTemplate(text: string, vars: Partial<TemplateVars>): string {
  let result = text;
  const merged = { ...SAMPLE_VARS, ...vars };
  for (const [key, val] of Object.entries(merged)) {
    result = result.replaceAll(`{${key}}`, val ?? '');
  }
  return result;
}

/* ── Build vars from a StoredOrder ──────────────────────────────────────── */
export function orderToVars(order: {
  name: string;
  orderId: string;
  items: Array<{ productName?: string; variant?: { size?: string; color?: string; optionName?: string } | null }>;
  grandTotal: number;
  estimatedDelivery?: string;
}): Partial<TemplateVars> {
  const product = order.items[0];
  const variantParts = product?.variant
    ? [product.variant.size, product.variant.color, product.variant.optionName].filter(Boolean).join(', ')
    : '';
  const productName = [product?.productName, variantParts].filter(Boolean).join(' — ');

  const trackBase = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingNum = 'SWTRACK' + order.orderId.replace(/[^A-Z0-9]/g, '').slice(-6);

  return {
    customer_name:     order.name,
    order_id:          order.orderId,
    product_name:      productName || 'Your item',
    total:             order.grandTotal.toLocaleString(),
    delivery_estimate: order.estimatedDelivery ?? '3-5 days',
    tracking_number:   trackingNum,
    delivery_date:     order.estimatedDelivery ?? 'within 3-5 days',
    tracking_url:      `${trackBase}/track-order?id=${order.orderId}`,
    review_url:        `${trackBase}/`,
    price:             order.grandTotal.toLocaleString(),
    store_url:         trackBase,
    store_name:        'SmartWear',
  };
}
