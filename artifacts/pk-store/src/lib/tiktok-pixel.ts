import { STORE_CONFIG } from "../config";

export const initPixel = () => {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    (window as any).ttq.load(STORE_CONFIG.tikTokPixelId);
    (window as any).ttq.page();
  }
};

export const trackPageView = () => {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    (window as any).ttq.page();
  }
};

export const trackViewContent = (product: { id: string; name: string; price: number }) => {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    (window as any).ttq.track('ViewContent', {
      contents: [
        {
          content_id: product.id,
          content_name: product.name,
          price: product.price,
          quantity: 1,
        }
      ],
      value: product.price,
      currency: STORE_CONFIG.currency,
    });
  }
};

export const trackInitiateCheckout = () => {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    (window as any).ttq.track('InitiateCheckout');
  }
};

export const trackCompletePayment = (value: number) => {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    (window as any).ttq.track('CompletePayment', {
      value,
      currency: STORE_CONFIG.currency,
    });
  }
};
