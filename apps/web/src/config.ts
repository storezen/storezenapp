export const STORE_CONFIG = {
  storeName: "SmartWear",
  tagline: "Discover Premium Smartwatches & Accessories",
  description: "Every piece in our collection is carefully selected to meet the highest standards of quality and design. From cutting-edge technology to sophisticated style, we bring you products that enhance your everyday moments. Your satisfaction is our promise, your style is our inspiration.",
  whatsappNumber: "923001234567", // aapka WhatsApp number replace karen
  tikTokPixelId: "YOUR_PIXEL_ID",  // aapka TikTok Pixel ID replace karen
  deliveryCharge: 200,
  currency: "PKR",
  copyright: "© 2026 SmartWear",
  adminPassword: "smartwear2024",
  payment: {
    jazzCashNumber:    "0300-1234567",
    easypaisaNumber:   "0300-1234567",
    accountTitle:      "SmartWear",
    bankName:          "Meezan Bank",
    bankAccountTitle:  "SmartWear",
    bankAccountNumber: "01234567890123",
    bankIBAN:          "PK36MEZN0001234567890123",
  },
};

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
export const DEFAULT_STORE_SLUG = import.meta.env.VITE_DEFAULT_STORE_SLUG ?? "smartwear";
export const REF_BASE_URL = import.meta.env.VITE_REF_BASE_URL ?? "";
