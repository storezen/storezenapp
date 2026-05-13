"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { useModal } from "@/components/ui/notifications/modal-system";
import { LoadingSpinner } from "@/components/ui/notifications/loading-states";
import type { Order } from "@/types";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-amber-700", bg: "bg-amber-50" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", color: "text-emerald-700", bg: "bg-emerald-50" },
  processing: { label: "Processing", color: "text-emerald-700", bg: "bg-emerald-50" },
  shipped: { label: "Shipped", color: "text-violet-700", bg: "bg-violet-50" },
  out_for_delivery: { label: "Out for Delivery", color: "text-violet-700", bg: "bg-violet-50" },
  delivered: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50" },
  returned: { label: "Returned", color: "text-orange-700", bg: "bg-orange-50" },
};

const statusOrder = ["new", "confirmed", "shipped", "delivered"];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const toast = useToast();
  const modal = useModal();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    authFetch(`/orders/${orderId}`)
      .then((data: unknown) => {
        const orderData = data as Order;
        setOrder(orderData);
      })
      .catch(() => {
        toast.error("Order not found");
        router.push("/account/orders");
      })
      .finally(() => setLoading(false));
  }, [orderId, router, toast]);

  async function updateOrderStatus(newStatus: string) {
    if (!order) return;

    modal.confirm(
      `Are you sure you want to ${newStatus} this order?`,
      async () => {
        setUpdating(true);
        try {
          await authFetch(`/orders/${order.id}`, {
            method: "PATCH",
            body: JSON.stringify({ orderStatus: newStatus }),
          });
          setOrder({ ...order, order_status: newStatus });
          toast.success(`Order ${newStatus} successfully`);
        } catch (error) {
          console.error("Failed to update status:", error);
          toast.error("Failed to update status");
        } finally {
          setUpdating(false);
        }
      },
      "Update Order Status"
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) return null;

  const currentStatus = order.order_status || "new";
  const currentIndex = statusOrder.indexOf(currentStatus);
  const meta = statusConfig[currentStatus] || statusConfig.new;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/account/orders" className="p-2 hover:bg-zinc-100 rounded-xl">
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Order #{order.id?.slice(-6)}</h1>
          <span className={cn("inline-flex px-3 py-1 rounded-full text-xs font-bold", meta.bg, meta.color)}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`https://wa.me/${order.customer_phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>

      {/* Timeline & Actions */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between">
          {/* Timeline */}
          <div className="flex items-center gap-1">
            {statusOrder.map((status, index) => {
              const isCompleted = currentIndex > index;
              const isCurrent = currentIndex === index;
              const isPending = currentIndex < index;

              return (
                <div key={status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                        isCompleted && "bg-emerald-500 text-white",
                        isCurrent && "bg-emerald-500 text-white ring-4 ring-emerald-100",
                        isPending && "bg-zinc-100 text-zinc-400"
                      )}
                    >
                      {isCompleted && <CheckCircle className="h-4 w-4" />}
                      {isCurrent && status === "new" && <Clock className="h-4 w-4" />}
                      {isCurrent && status === "confirmed" && <Package className="h-4 w-4" />}
                      {isCurrent && status === "shipped" && <Truck className="h-4 w-4" />}
                      {isCurrent && status === "delivered" && <CheckCircle className="h-4 w-4" />}
                      {isPending && <Clock className="h-4 w-4" />}
                    </div>
                    <span className={cn(
                      "text-xs font-medium mt-1",
                      isCompleted || isCurrent ? "text-zinc-900" : "text-zinc-400"
                    )}>
                      {statusConfig[status]?.label}
                    </span>
                  </div>
                  {index < statusOrder.length - 1 && (
                    <div className={cn("w-5 h-0.5 mx-0.5 mb-4", isCompleted ? "bg-emerald-500" : "bg-zinc-200")} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons - Right Side */}
          {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
            <div className="flex items-center gap-2">
              {currentStatus === "new" && (
                <Button onClick={() => updateOrderStatus("confirmed")} disabled={updating} className="gap-2">
                  {updating ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                  Confirm
                </Button>
              )}
              {currentStatus === "confirmed" && (
                <Button onClick={() => updateOrderStatus("shipped")} disabled={updating} className="gap-2">
                  {updating ? <LoadingSpinner size="sm" /> : <Truck className="h-4 w-4" />}
                  Shipped
                </Button>
              )}
              {currentStatus === "shipped" && (
                <Button onClick={() => updateOrderStatus("delivered")} disabled={updating} className="gap-2">
                  {updating ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                  Delivered
                </Button>
              )}
              <div className="w-px h-6 bg-zinc-200 mx-1" />
              <Button variant="ghost" onClick={() => updateOrderStatus("cancelled")} disabled={updating} className="text-red-600 hover:bg-red-50 px-2">
                {updating ? <LoadingSpinner size="sm" /> : <XCircle className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {currentStatus === "cancelled" && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Cancelled</span>
            </div>
          )}

          {currentStatus === "delivered" && (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Delivered</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="font-bold tracking-tight text-zinc-900">Items ({order.items?.length})</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{item.name}</p>
                    <p className="text-sm text-zinc-500">{item.qty} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="font-bold text-zinc-900">{formatCurrency(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-900">{formatCurrency(order.subtotal || order.total)}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Delivery</span>
                  <span className="text-zinc-900">{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Discount</span>
                  <span className="text-emerald-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold tracking-tight pt-2 border-t border-zinc-200">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Card */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h3 className="font-bold tracking-tight text-zinc-900">Customer</h3>
            </div>
            <div className="p-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 font-bold text-lg">{order.customer_name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{order.customer_name}</p>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">New Customer</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mb-5">
                <a href={`tel:${order.customer_phone}`} className="flex-1">
                  <Button variant="secondary" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                </a>
                <a href={`https://wa.me/${order.customer_phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <a href={`tel:${order.customer_phone}`} className="text-sm font-medium text-zinc-900 hover:text-emerald-600">
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{order.customer_address}</p>
                    <p className="text-xs text-zinc-500">{order.customer_city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="font-bold tracking-tight text-zinc-900 mb-4">Shipping</h3>
            {order.tracking_number ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Courier</span>
                  <span className="font-medium text-zinc-900">{order.courier || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Tracking</span>
                  <span className="font-medium text-zinc-900">{order.tracking_number}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No tracking info yet</p>
            )}
          </div>

          {/* Details */}
          {(order.coupon_code || order.ref_code) && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="font-bold tracking-tight text-zinc-900 mb-4">Details</h3>
              <div className="space-y-2">
                {order.coupon_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Coupon</span>
                    <span className="font-medium text-zinc-900">{order.coupon_code}</span>
                  </div>
                )}
                {order.ref_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Referral</span>
                    <span className="font-medium text-zinc-900">{order.ref_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}