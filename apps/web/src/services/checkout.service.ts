import { apiFetch } from "@/lib/api";

type PlaceOrderInput = {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  paymentMethod: string;
  couponCode?: string;
  items: Array<{ productId: string; quantity: number; variantId?: string }>;
};

export async function placeOrderRequest(payload: PlaceOrderInput) {
  return apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
