/** Mirrors server `ORDER_TRANSITIONS` in `orders.service` — quick actions in admin UI. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const NEXT: Record<string, { key: string; status: string; label: string }[]> = {
  new: [
    { key: "confirm", status: "confirmed", label: "Confirm" },
    { key: "cancel", status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { key: "ship", status: "shipped", label: "Mark shipped" },
    { key: "cancel", status: "cancelled", label: "Cancel" },
  ],
  shipped: [
    { key: "out", status: "out_for_delivery", label: "Out for delivery" },
    { key: "deliver", status: "delivered", label: "Delivered" },
    { key: "return", status: "returned", label: "Returned" },
  ],
  out_for_delivery: [
    { key: "deliver", status: "delivered", label: "Delivered" },
    { key: "return", status: "returned", label: "Returned" },
  ],
  delivered: [],
  cancelled: [],
  returned: [],
};

export function getQuickOrderActions(currentStatus: string) {
  return NEXT[currentStatus] ?? [];
}
