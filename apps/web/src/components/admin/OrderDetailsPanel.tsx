"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Phone, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { authFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type OrderDetail = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  total: number;
  status: string;
  items: { name: string; qty: number; price: number; image?: string }[];
  createdAt: string;
};

type Props = {
  orderId: string;
  open: boolean;
  onClose: () => void;
};

export function OrderDetailsPanel({ orderId, open, onClose }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !orderId) return;
    setLoading(true);
    authFetch(`/orders/${orderId}`)
      .then((data: unknown) => setOrder(data as OrderDetail))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId, open]);

  const statusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "shipped": return <Truck className="h-4 w-4 text-violet-500" />;
      case "processing": return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Package className="h-4 w-4 text-amber-500" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative ml-auto w-full max-w-lg overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <h2 className="font-semibold text-zinc-900">Order Details</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : !order ? (
          <div className="p-6 text-center text-sm text-zinc-400">Order not found</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Order</p>
                <p className="font-mono font-bold text-zinc-900">{order.orderNumber}</p>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                order.status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                order.status === "shipped" ? "bg-violet-50 text-violet-700" :
                order.status === "processing" ? "bg-blue-50 text-blue-700" :
                "bg-amber-50 text-amber-700"
              )}>
                {statusIcon(order.status)}
                {order.status}
              </div>
            </div>

            {/* Customer */}
            <div className="rounded-xl bg-zinc-50 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Customer</h3>
              <p className="font-medium text-zinc-900">{order.customerName}</p>
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Phone className="h-3.5 w-3.5" />
                {order.customerPhone}
              </div>
              <div className="flex items-start gap-2 text-sm text-zinc-600">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {order.customerAddress}{order.city ? `, ${order.city}` : ""}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Items</h3>
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-zinc-100" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-zinc-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.qty}x · {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{formatCurrency(item.qty * item.price)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <p className="font-medium text-white">Total</p>
              <p className="text-lg font-extrabold text-white">{formatCurrency(order.total)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
