import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fixed fraction digits so SSR (Node) and the browser render the same string — avoids
 * CartDrawer/checkout hydration errors when Node's ICU omits " .00" for whole PKR amounts.
 */
export function formatCurrency(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
