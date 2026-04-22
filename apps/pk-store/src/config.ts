const rawApi = import.meta.env.VITE_API_URL as string | undefined;
/** Base URL for API including the `/api` path (this repo mounts Express routes at `/api`). */
export const API_URL = (rawApi?.replace(/\/$/, "") ?? "") || "http://localhost:3000/api";

/** Default tenant slug on localhost / apex hosts (see `hooks/use-store-slug`). */
export const DEFAULT_STORE_SLUG =
  (import.meta.env.VITE_DEFAULT_STORE as string | undefined)?.trim() ||
  (import.meta.env.VITE_DEFAULT_STORE_SLUG as string | undefined)?.trim() ||
  "demo";

/** Public app / brand name for fallbacks when store data is not loaded yet. */
export const APP_NAME =
  (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() || "StorePK";

export const STORE_CONFIG = {
  storeName: APP_NAME,
  tagline: "Discover Premium Smartwatches & Accessories",
  description:
    "Every piece in our collection is carefully selected to meet the highest standards of quality and design. From cutting-edge technology to sophisticated style, we bring you products that enhance your everyday moments. Your satisfaction is our promise, your style is our inspiration.",
  whatsappNumber: "923001234567",
  tikTokPixelId: "YOUR_PIXEL_ID",
  deliveryCharge: 200,
  currency: "PKR",
  copyright: `© 2026 ${APP_NAME}`,
  adminPassword: "zorvik2024",
  payment: {
    jazzCashNumber: "0300-1234567",
    easypaisaNumber: "0300-1234567",
    accountTitle: APP_NAME,
    bankName: "Meezan Bank",
    bankAccountTitle: APP_NAME,
    bankAccountNumber: "01234567890123",
    bankIBAN: "PK36MEZN0001234567890123",
  },
};

export const REF_BASE_URL = import.meta.env.VITE_REF_BASE_URL ?? "";
