import { Clock, Package, Truck, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export type OrderStatus =
  | "new"
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export type OrderStatusConfig = {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  step: number; // For timeline display
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  new: {
    label: "New",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: Clock,
    step: 0,
  },
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: Clock,
    step: 1,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-700",
    bg: "bg-blue-50",
    icon: Package,
    step: 2,
  },
  processing: {
    label: "Processing",
    color: "text-blue-700",
    bg: "bg-blue-50",
    icon: Package,
    step: 3,
  },
  shipped: {
    label: "Shipped",
    color: "text-violet-700",
    bg: "bg-violet-50",
    icon: Truck,
    step: 4,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-purple-700",
    bg: "bg-purple-50",
    icon: Truck,
    step: 5,
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    icon: CheckCircle,
    step: 6,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    icon: XCircle,
    step: -1,
  },
  returned: {
    label: "Returned",
    color: "text-orange-700",
    bg: "bg-orange-50",
    icon: RotateCcw,
    step: -1,
  },
};

export const ORDER_STATUS_LIST: OrderStatus[] = [
  "new",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const ORDER_STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export function getStatusConfig(status: string): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status as OrderStatus] ?? ORDER_STATUS_CONFIG.pending;
}
