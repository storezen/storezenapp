export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME;
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP;
export const PHONE = process.env.NEXT_PUBLIC_PHONE;
export const CURRENCY = "PKR";
export const DELIVERY_FEE = 200;
/** Subtotal at or above this amount ships free (COD still applies). */
export const FREE_SHIPPING_MIN_SUBTOTAL = 2000;
export const PHONE_REGEX = /^03[0-9]{9}$/;
export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Multan",
  "Faisalabad",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Wah Cantonment",
  "Mardan",
  "Abbottabad",
  "Kasur",
  "Jhang",
  "Dera Ghazi Khan",
  "Rahim Yar Khan",
  "Larkana",
  "Sheikhupura",
  "Burewala",
];
export const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "Easypaisa" },
];
