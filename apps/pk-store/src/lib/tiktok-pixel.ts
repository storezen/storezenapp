import { STORE_CONFIG } from "../config";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TtqItem {
  content_id: string;
  content_name?: string;
  content_category?: string;
  quantity: number;
  price: number;
}

interface TtqInstance {
  load: (pixelId: string) => void;
  page: () => void;
  track: (event: string, params?: Record<string, unknown>) => void;
  identify: (params: Record<string, unknown>) => void;
}

declare global {
  interface Window { ttq?: TtqInstance; }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isDev = import.meta.env.DEV;
const pixelId = STORE_CONFIG.tikTokPixelId?.trim();
const hasUsablePixelId =
  Boolean(pixelId) &&
  pixelId !== "YOUR_PIXEL_ID" &&
  pixelId !== "YOUR-PIXEL-ID";

function ttq(): TtqInstance | null {
  return (typeof window !== 'undefined' && window.ttq) ? window.ttq : null;
}

function devLog(event: string, params?: Record<string, unknown>) {
  if (isDev) {
    console.log(
      `%c[TikTok Pixel] ${event}`,
      'color:#ee1d52;font-weight:bold;font-size:11px',
      params ?? ''
    );
  }
}

// ─── Init & PageView ───────────────────────────────────────────────────────────

/** Load the pixel script and fire the first PageView. Call once on app mount. */
function isUsablePixelId(id: string | undefined | null): id is string {
  const t = id?.trim();
  return Boolean(t) && t !== "YOUR_PIXEL_ID" && t !== "YOUR-PIXEL-ID";
}

export const initPixel = () => {
  if (!hasUsablePixelId) {
    if (isDev) {
      console.info(
        "[TikTok Pixel] Skipped init: set a real pixel ID in STORE_CONFIG.tikTokPixelId",
      );
    }
    return;
  }

  const t = ttq();
  if (!t) {
    if (isDev) {
      console.warn(
        "[TikTok Pixel] SDK not ready yet; ensure TikTok script is loaded before init.",
      );
    }
    return;
  }
  t.load(pixelId as string);
  t.page();
  devLog('PageView (init)');
};

/** Load TikTok Pixel from store settings (overrides / supplements default init). */
export function initPixelWithId(pixelId: string | null | undefined) {
  if (!isUsablePixelId(pixelId)) return;
  const t = ttq();
  if (!t) {
    if (isDev) {
      console.warn(
        "[TikTok Pixel] SDK not ready; initPixelWithId skipped",
      );
    }
    return;
  }
  t.load(pixelId.trim());
  t.page();
  devLog("PageView (store pixel)");
}

/** Fire on every SPA route change. */
export const trackPageView = () => {
  const t = ttq();
  if (!t) return;
  t.page();
  devLog('PageView');
};

// ─── Product Events ────────────────────────────────────────────────────────────

export interface ProductTrackData {
  id: string;
  name: string;
  price: number;
  category?: string;
}

/**
 * ViewContent — fire when a user opens a Product Detail page.
 * Includes content_id, content_name, content_category, price, currency.
 */
export const trackViewContent = (product: ProductTrackData) => {
  const t = ttq();
  const params = {
    content_type: 'product',
    contents: [
      {
        content_id:       product.id,
        content_name:     product.name,
        content_category: product.category ?? '',
        quantity:         1,
        price:            product.price,
      } as TtqItem,
    ],
    value:    product.price,
    currency: STORE_CONFIG.currency,
  };
  if (!t) { devLog('ViewContent [NO PIXEL]', params); return; }
  t.track('ViewContent', params);
  devLog('ViewContent', params);
};

/**
 * AddToCart — fire when user clicks "Add to Cart".
 * Includes content_id, content_name, quantity, price, currency.
 */
export const trackAddToCart = (product: ProductTrackData, quantity: number) => {
  const t = ttq();
  const params = {
    content_type: 'product',
    contents: [
      {
        content_id:       product.id,
        content_name:     product.name,
        content_category: product.category ?? '',
        quantity,
        price:            product.price,
      } as TtqItem,
    ],
    value:    product.price * quantity,
    currency: STORE_CONFIG.currency,
  };
  if (!t) { devLog('AddToCart [NO PIXEL]', params); return; }
  t.track('AddToCart', params);
  devLog('AddToCart', params);
};

// ─── Checkout Events ───────────────────────────────────────────────────────────

export interface CartTrackItem {
  id: string;
  price: number;
  quantity: number;
}

/**
 * InitiateCheckout — fire when the COD form / cart checkout opens.
 * Includes content_ids array, total value, currency, number of items.
 */
export const trackInitiateCheckout = (items: CartTrackItem[], total: number) => {
  const t = ttq();
  const contents: TtqItem[] = items.map(i => ({
    content_id: i.id,
    quantity:   i.quantity,
    price:      i.price,
  }));
  const params = {
    content_type: 'product',
    contents,
    content_ids:  items.map(i => i.id),
    value:        total,
    currency:     STORE_CONFIG.currency,
    num_items:    items.reduce((s, i) => s + i.quantity, 0),
  };
  if (!t) { devLog('InitiateCheckout [NO PIXEL]', params); return; }
  t.track('InitiateCheckout', params);
  devLog('InitiateCheckout', params);
};

/**
 * CompletePayment — fire when the COD order is submitted successfully.
 * Includes content_ids, total value, currency, num_items, order_id.
 */
export const trackCompletePayment = (items: CartTrackItem[], total: number, orderId: string) => {
  const t = ttq();
  const contents: TtqItem[] = items.map(i => ({
    content_id: i.id,
    quantity:   i.quantity,
    price:      i.price,
  }));
  const params = {
    content_type: 'product',
    contents,
    content_ids:  items.map(i => i.id),
    value:        total,
    currency:     STORE_CONFIG.currency,
    num_items:    items.reduce((s, i) => s + i.quantity, 0),
    order_id:     orderId,
  };
  if (!t) { devLog('CompletePayment [NO PIXEL]', params); return; }
  t.track('CompletePayment', params);
  devLog('CompletePayment', params);
};

// ─── Engagement Events ─────────────────────────────────────────────────────────

/**
 * Contact — fire when user clicks "Order via WhatsApp" on a product page.
 * Includes content_id (product id).
 */
export const trackContact = (productId?: string) => {
  const t = ttq();
  const params = productId
    ? { content_id: productId, content_type: 'product' }
    : undefined;
  if (!t) { devLog('Contact [NO PIXEL]', params); return; }
  t.track('Contact', params ?? {});
  devLog('Contact', params);
};

/**
 * ClickButton — fire for key CTA clicks.
 * @param buttonName  Descriptive name, e.g. 'shop_now_hero', 'category_clothing', 'view_all_products'
 */
export const trackClickButton = (buttonName: string) => {
  const t = ttq();
  const params = { button_name: buttonName };
  if (!t) { devLog('ClickButton [NO PIXEL]', params); return; }
  t.track('ClickButton', params);
  devLog('ClickButton', params);
};
