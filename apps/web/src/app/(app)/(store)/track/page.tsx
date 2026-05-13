"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MessageCircle, Search, ChevronRight, Truck, CheckCircle2, Clock, Box } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { WHATSAPP } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Box },
];

function getStepIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status.toLowerCase()) ?? 0;
}

function getOrderMeta(status: string) {
  switch (status) {
    case "delivered": return { color: "emerald", text: "Delivered" };
    case "shipped": return { color: "blue", text: "Shipped" };
    case "confirmed": return { color: "amber", text: "Confirmed" };
    case "processing": return { color: "amber", text: "Processing" };
    case "cancelled": return { color: "red", text: "Cancelled" };
    default: return { color: "zinc", text: "Pending" };
  }
}

export default function TrackPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (orderId.trim()) q.set("id", orderId.trim());
      if (phone.trim()) q.set("phone", phone.trim());
      const res = await apiFetch(`/orders/track?${q.toString()}`);
      setOrder((res as { order?: Order }).order ?? (res as Order));
    } catch {
      setOrder(null);
      setError("Order not found. Please check your Order ID and phone number.");
    } finally {
      setLoading(false);
    }
  }

  const meta = order ? getOrderMeta(order.order_status) : null;
  const stepIdx = order ? getStepIndex(order.order_status ?? "") : 0;

  return (
    <div className="safe-bottom pb-12 pt-6 md:pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4 inline-flex"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <Package className="h-6 w-6" strokeWidth={2.5} />
            </div>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter your Order ID and/or phone number as shown on your receipt
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mb-8 max-w-2xl"
        >
          <form
            onSubmit={submit}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:flex sm:items-end sm:gap-3 sm:p-6"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="track-order-id" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Order ID
              </label>
              <Input
                id="track-order-id"
                className="h-12 rounded-xl"
                placeholder="e.g. ORD-2026-1042"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2 sm:mt-0">
              <label htmlFor="track-phone" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Phone
              </label>
              <Input
                id="track-phone"
                className="h-12 rounded-xl"
                placeholder="03XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
              />
            </div>
            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="h-12 shrink-0 rounded-xl px-6 font-bold shadow-lg shadow-zinc-900/10 sm:w-[140px]"
            >
              <Search className="h-4 w-4 sm:hidden" strokeWidth={2.5} />
              <span className="hidden sm:inline">Track Order</span>
            </Button>
          </form>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Result */}
        <AnimatePresence>
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-2xl rounded-2xl border border-zinc-200/80 bg-white shadow-sm"
            >
              {/* Order header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Order ID</p>
                  <p className="mt-1 font-mono text-xl font-bold text-zinc-900">#{order.id}</p>
                </div>
                {meta && (
                  <Badge
                    variant={meta.color as "success" | "warning" | "info" | "default" | "destructive"}
                    className="text-[10px]"
                  >
                    {meta.text}
                  </Badge>
                )}
              </div>

              {/* Timeline */}
              <div className="border-b border-zinc-100 p-5 sm:p-6">
                <OrderStatusTimeline currentStep={order.order_status || "placed"} />
              </div>

              {/* Tracking number + details */}
              <div className="space-y-4 p-5 sm:p-6">
                {order.tracking_number && (
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tracking ID</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-900">{order.tracking_number}</p>
                  </div>
                )}

                <div className="grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Customer</p>
                    <p className="mt-1 font-medium text-zinc-900">{order.customer_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total</p>
                    <p className="mt-1 font-semibold text-zinc-900 tabular-nums">
                      {formatCurrency(Number(order.total))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Courier</p>
                    <p className="mt-1 font-medium text-zinc-900">{order.tracking_number ? "PostEx" : "—"}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
                  <h3 className="mb-3 text-sm font-bold text-zinc-900">Items</h3>
                  {(order.items ?? []).length > 0 ? order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-zinc-100 py-2.5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{item.name || "Product"} × {item.qty || 1}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-zinc-900">
                        {formatCurrency(Number(item.price || order.total))}
                      </p>
                    </div>
                  )) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-600">Order total</p>
                      <p className="font-semibold text-zinc-900">{formatCurrency(Number(order.total))}</p>
                    </div>
                  )}
                </div>

                {WHATSAPP ? (
                  <Button variant="whatsapp" size="lg" className="w-full rounded-xl font-bold gap-2" asChild>
                    <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" strokeWidth={2} />
                      Chat on WhatsApp for updates
                    </a>
                  </Button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
