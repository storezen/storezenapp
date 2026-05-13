import { authFetch } from "@/lib/api";
import type { HomePageContentV1 } from "@/lib/cms/homepage-block-types";
import type { Order } from "@/types";

export async function getMyStorePages() {
  return authFetch("/stores/my/pages") as Promise<{
    homePage: HomePageContentV1;
    updatedAt: string | null;
  }>;
}

export async function updateMyStorePages(home: HomePageContentV1) {
  return authFetch("/stores/my/pages", { method: "PUT", body: JSON.stringify(home) }) as Promise<{
    homePage: HomePageContentV1;
    updatedAt: string | null;
  }>;
}

export async function updateOrderStatus(orderId: string, status: string) {
  return authFetch(`/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) }) as Promise<Order>;
}
