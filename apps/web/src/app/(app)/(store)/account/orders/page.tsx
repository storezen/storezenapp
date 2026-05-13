"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import { SkeletonTable } from "@/components/ui/notifications/loading-states";
import { useToast } from "@/components/ui/notifications/toast-system";
import type { Order } from "@/types";

type StatusFilter = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-amber-700", bg: "bg-amber-50" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", color: "text-emerald-700", bg: "bg-emerald-50" },
  shipped: { label: "Shipped", color: "text-violet-700", bg: "bg-violet-50" },
  delivered: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50" },
};

const filters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Unfulfilled" },
  { id: "shipped", label: "In Transit" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchOrders = useCallback(() => {
    setRefreshing(true);
    authFetch("/orders")
      .then((r: unknown) => {
        const data = r as { orders?: Order[] };
        setOrders(data.orders ?? []);
        if (data.orders?.length === 0) {
          toast.info("No orders yet");
        }
      })
      .catch((err) => {
        toast.error("Failed to load orders");
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = orders
    .filter((o) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        o.id?.toLowerCase().includes(searchLower) ||
        o.customer_name?.toLowerCase().includes(searchLower) ||
        o.customer_phone?.includes(search);
      const status = o.order_status ?? "pending";
      const matchesFilter = filter === "all" ||
        (filter === "pending" && ["new", "pending"].includes(status)) ||
        status === filter;
      return matchesSearch && matchesFilter;
    });

  const statusCounts = orders.reduce(
    (acc, o) => {
      const status = o.order_status ?? "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
          <p className="text-sm text-zinc-500">{filteredOrders.length} orders</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={refreshing} className="self-start sm:self-center">
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4">
        {filters.map((f) => {
          const isActive = filter === f.id;
          const count = f.id === "all"
            ? orders.length
            : f.id === "pending"
              ? (statusCounts.new || 0) + (statusCounts.pending || 0)
              : f.id === "shipped"
                ? (statusCounts.shipped || 0)
                : statusCounts[f.id] || 0;

          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {f.label}
              {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
          </button>
        );
      })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
          <ShoppingCart className="mx-auto h-10 w-10 text-zinc-300" />
          <h3 className="mt-4 font-bold text-zinc-900">No orders found</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {filter !== "all" || search ? "Try different filters" : "Orders will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Order</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-zinc-500 uppercase tracking-wide">Total</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((order) => {
                const meta = statusConfig[order.order_status ?? "pending"] || statusConfig.pending;

                return (
                  <tr key={order.id} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <Link href={`/account/orders/${order.id}`} className="font-bold text-zinc-900 hover:text-emerald-600">
                        #{order.id?.slice(-6)}
                      </Link>
                      <p className="text-xs text-zinc-400 mt-0.5">{order.items?.length || 0} items</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600">
                        {new Date(order.created_at).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{order.customer_name || "—"}</p>
                      <p className="text-xs text-zinc-500">{order.customer_city}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-zinc-900">{formatCurrency(order.total)}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{order.payment_method === "cod" ? "COD" : "Paid"}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-bold", meta.bg, meta.color)}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="p-2 hover:bg-zinc-100 rounded-lg inline-block"
                      >
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Info */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <p>Showing {filteredOrders.length} of {orders.length} orders</p>
        </div>
      )}
    </div>
  );
}