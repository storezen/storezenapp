/* ── Order types ──────────────────────────────────────────────────────────── */
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
    optionName?: string;
  };
};

export type StoredOrder = {
  orderId: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  notes?: string;
};

/* ── Status step definitions ─────────────────────────────────────────────── */
export const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'placed',           label: 'Order Placed',      icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',          icon: '✅' },
  { key: 'shipped',          label: 'Shipped',            icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',          icon: '🎉' },
  { key: 'cancelled',        label: 'Cancelled',          icon: '❌' },
];

/* ── LocalStorage helpers ────────────────────────────────────────────────── */
export const ORDERS_KEY = 'zorvik_orders';
const LAST_ID_KEY = 'zorvik_last_order_id';
const ORDERS_KEY_LEGACY = 'sw_orders';
const LAST_ID_KEY_LEGACY = 'sw_last_order_id';

function migrateLegacyOrderStorage(): void {
  try {
    if (!localStorage.getItem(ORDERS_KEY) && localStorage.getItem(ORDERS_KEY_LEGACY)) {
      localStorage.setItem(ORDERS_KEY, localStorage.getItem(ORDERS_KEY_LEGACY)!);
    }
    if (!localStorage.getItem(LAST_ID_KEY) && localStorage.getItem(LAST_ID_KEY_LEGACY)) {
      localStorage.setItem(LAST_ID_KEY, localStorage.getItem(LAST_ID_KEY_LEGACY)!);
    }
  } catch {
    /* ignore */
  }
}

export function getAllOrders(): StoredOrder[] {
  migrateLegacyOrderStorage();
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as StoredOrder[]) : [];
  } catch { return []; }
}

export function saveOrder(order: StoredOrder): void {
  try {
    const all = getAllOrders();
    const idx = all.findIndex(o => o.orderId === order.orderId);
    if (idx >= 0) { all[idx] = order; } else { all.unshift(order); }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  } catch { /* ignore quota errors */ }
}

export function getOrderById(orderId: string): StoredOrder | null {
  return getAllOrders().find(o =>
    o.orderId.toLowerCase() === orderId.trim().toLowerCase()
  ) ?? null;
}

export function searchOrders(query: string): StoredOrder[] {
  if (!query.trim()) return [];
  const q     = query.trim();
  const qLow  = q.toLowerCase();
  const qDig  = q.replace(/\D/g, '');
  return getAllOrders().filter(o => {
    const idHit    = o.orderId.toLowerCase().includes(qLow);
    const phoneHit = qDig.length >= 4 && o.phone.replace(/\D/g, '').includes(qDig);
    return idHit || phoneHit;
  });
}

export function setLastOrderId(id: string): void {
  migrateLegacyOrderStorage();
  try { localStorage.setItem(LAST_ID_KEY, id); } catch { /* ignore */ }
}

export function getLastOrderId(): string | null {
  migrateLegacyOrderStorage();
  try { return localStorage.getItem(LAST_ID_KEY); } catch { return null; }
}

export function getStatusIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex(s => s.key === status);
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): boolean {
  try {
    const all = getAllOrders();
    const idx = all.findIndex(o => o.orderId === orderId);
    if (idx < 0) return false;
    all[idx] = { ...all[idx], status: newStatus };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
    return true;
  } catch { return false; }
}

/* ── WhatsApp message templates (for store owner) ─────────────────────────── */
export function getWhatsAppTemplate(order: StoredOrder, forStatus: OrderStatus): string {
  const firstName   = order.name.split(' ')[0];
  const productList = order.items.map(i => i.productName).join(', ');
  const trackUrl    = `${window.location.origin}/track-order`;

  switch (forStatus) {
    case 'confirmed':
      return (
        `Hi ${firstName}! 🎉 Your order *${order.orderId}* for *${productList}* has been confirmed.\n` +
        `Expected delivery: *${order.estimatedDelivery}*.\n` +
        `Track your order here: ${trackUrl}`
      );
    case 'shipped':
      return (
        `Good news ${firstName}! 📦 Your order *${order.orderId}* has been shipped.\n` +
        `Expected delivery: *${order.estimatedDelivery}*.\n` +
        `Track here: ${trackUrl}`
      );
    case 'out_for_delivery':
      return (
        `🚚 ${firstName}, your order *${order.orderId}* is out for delivery today!\n` +
        `Please keep your phone available. COD Amount: *Rs. ${order.grandTotal}*`
      );
    case 'delivered':
      return (
        `✅ ${firstName}, your order *${order.orderId}* has been delivered!\n` +
        `Thank you for shopping with Zorvik! 🛍️\n` +
        `Leave us a review: ${window.location.origin}/product/${order.items[0]?.productId ?? ''}`
      );
    default:
      return '';
  }
}
