"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  ShoppingBag,
  Printer,
  MessageCircle,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { useModal } from "@/components/ui/notifications/modal-system";
import { LoadingSpinner } from "@/components/ui/notifications/loading-states";
import type { Order } from "@/types";

const statusSteps = [
  { id: "pending", label: "Pending", icon: Clock, color: "amber" },
  { id: "confirmed", label: "Confirmed", icon: Package, color: "blue" },
  { id: "shipped", label: "Shipped", icon: Truck, color: "violet" },
  { id: "delivered", label: "Delivered", icon: CheckCircle, color: "emerald" },
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
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
        setOrder(data as Order);
      })
      .catch(() => {
        toast.error("Order not found");
        router.push("/admin/orders");
      })
      .finally(() => setLoading(false));
  }, [orderId, router, toast]);

  async function updateStatus(newStatus: string) {
    if (!order) return;

    modal.confirm(
      `Are you sure you want to mark this order as ${newStatus}?`,
      async () => {
        setUpdating(true);
        try {
          await authFetch(`/orders/${order.id}`, {
            method: "PATCH",
            body: JSON.stringify({ orderStatus: newStatus }),
          });
          setOrder({ ...order, order_status: newStatus });
          toast.success(`Order marked as ${newStatus}`);
        } catch (error) {
          console.error("Failed to update:", error);
          toast.error("Failed to update status");
        } finally {
          setUpdating(false);
        }
      },
      "Update Order Status"
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.id === order?.order_status);
  const isCancelled = order?.order_status === "cancelled";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 hover:bg-zinc-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Order #{order.id?.slice(-6)}</h1>
            <p className="text-sm text-zinc-500">
              Placed on {new Date(order.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-900">Order Status</h2>
          {!isCancelled && (
            <div className="flex gap-2">
              {statusSteps.map((step) => (
                <Button
                  key={step.id}
                  variant={order.order_status === step.id ? "primary" : "outline"}
                  size="sm"
                  onClick={() => updateStatus(step.id)}
                  disabled={updating || order.order_status === step.id}
                >
                  {step.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => updateStatus("cancelled")}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-200 -z-10">
            <div className="h-full bg-emerald-500" style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }} />
          </div>
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2", isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-zinc-300 text-zinc-400")}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className={cn("text-xs mt-2 font-medium", isCompleted ? "text-zinc-900" : "text-zinc-400")}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-lg">
                  <div className="w-14 h-14 bg-white rounded-lg border flex items-center justify-center">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover rounded-lg" /> : <Package className="h-5 w-5 text-zinc-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-sm text-zinc-500">Qty: {item.qty} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="font-semibold text-zinc-900">{formatCurrency(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="text-zinc-900">{formatCurrency(order.subtotal || order.total)}</span></div>
              {order.delivery_fee > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Delivery</span><span className="text-zinc-900">{formatCurrency(order.delivery_fee)}</span></div>}
              {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Discount</span><span className="text-emerald-600">-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Payment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-zinc-500">Method</p><p className="font-medium capitalize">{order.payment_method || "COD"}</p></div>
              <div><p className="text-sm text-zinc-500">Status</p><span className={cn("px-2 py-1 rounded-full text-xs font-medium", order.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{order.payment_status || "pending"}</span></div>
              {order.coupon_code && <div><p className="text-sm text-zinc-500">Coupon</p><p className="font-medium">{order.coupon_code}</p></div>}
              {order.ref_code && <div><p className="text-sm text-zinc-500">Referral</p><p className="font-medium">{order.ref_code}</p></div>}
            </div>
          </div>
        </div>

        {/* Customer & Shipping */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center"><span className="text-violet-600 font-bold">{order.customer_name?.charAt(0)}</span></div>
                <div><p className="font-medium">{order.customer_name}</p></div>
              </div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-zinc-400" /><a href={`tel:${order.customer_phone}`} className="text-sm text-zinc-600">{order.customer_phone}</a></div>
              <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-zinc-400 mt-0.5" /><div><p className="text-sm">{order.customer_address}</p><p className="text-sm text-zinc-500">{order.customer_city}</p></div></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Shipping</h2>
            {order.tracking_number ? (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-zinc-500">Courier</span><span className="text-sm font-medium">{order.courier || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-sm text-zinc-500">Tracking #</span><span className="text-sm font-medium">{order.tracking_number}</span></div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Not shipped yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Notes</h2>
            {order.notes ? <p className="text-sm text-zinc-600">{order.notes}</p> : <p className="text-sm text-zinc-400">No notes</p>}
          </div>
        </div>
      </div>
    </div>
  );
}