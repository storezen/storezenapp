type AnalyticsPayload = Record<string, unknown>;

const defaultFlags = {
  trackPageView: true,
  trackViewProduct: true,
  trackAddToCart: true,
  trackPurchase: true,
  trackInitiateCheckout: true,
};

type AnalyticsKey = keyof typeof defaultFlags;
let eventFlags: typeof defaultFlags = { ...defaultFlags };

/** Call from `StorePixels` when public store is loaded (themeColors.analytics). */
export function setStoreAnalyticsFlags(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    eventFlags = { ...defaultFlags };
    return;
  }
  const a = raw as Record<string, unknown>;
  eventFlags = {
    trackPageView: a.trackPageView !== false,
    trackViewProduct: a.trackViewProduct !== false,
    trackAddToCart: a.trackAddToCart !== false,
    trackPurchase: a.trackPurchase !== false,
    trackInitiateCheckout: a.trackInitiateCheckout !== false,
  };
}

function allow(key: AnalyticsKey) {
  return eventFlags[key] !== false;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, payload?: AnalyticsPayload) => void;
    };
    dataLayer?: unknown[];
  }
}

function pushDataLayer(event: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...(payload ?? {}) });
}

export function trackEvent(event: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  pushDataLayer(event, payload);
  window.fbq?.("trackCustom", event, payload ?? {});
  window.ttq?.track(event, payload);
}

export function trackViewProduct(productId: string, name: string, value: number) {
  if (!allow("trackViewProduct")) return;
  trackEvent("view_product", { productId, name, value });
}

export function trackAddToCart(productId: string, name: string, qty: number, value: number) {
  if (!allow("trackAddToCart")) return;
  trackEvent("add_to_cart", { productId, name, qty, value });
}

export function trackInitiateCheckout(value: number, itemCount: number) {
  if (!allow("trackInitiateCheckout")) return;
  trackEvent("initiate_checkout", { value, itemCount });
}

export function trackPurchase(orderId: string, value: number) {
  if (!allow("trackPurchase")) return;
  trackEvent("purchase", { orderId, value });
}
