"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/api";
import {
  ShoppingCart,
  Store,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { LoadingSpinner } from "@/components/ui/notifications/loading-states";

type PlatformStats = {
  totalOrders: number;
  totalStores: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const toast = useToast();

  const fetchData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    Promise.all([
      authFetch("/admin/stats").catch(() => null),
      authFetch("/admin/orders?limit=10").catch(() => null),
    ])
      .then(([statsData, ordersData]) => {
        if (statsData) setStats(statsData as PlatformStats);
        const orders = ordersData as { orders?: RecentOrder[] };
        if (orders?.orders) setRecentOrders(orders.orders);
      })
      .catch(() => {
        toast.error("Failed to load dashboard data");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
    { label: "Total Stores", value: stats?.totalStores ?? 0, icon: Store, color: "bg-violet-50 text-violet-600" },
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-amber-50 text-amber-600" },
    { label: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, color: "bg-emerald-50 text-emerald-600" },
  ];

  const orderStats = [
    { label: "Pending", value: stats?.pendingOrders ?? 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Processing", value: stats?.processingOrders ?? 0, icon: Truck, color: "bg-blue-50 text-blue-600" },
    { label: "Shipped", value: stats?.shippedOrders ?? 0, icon: Truck, color: "bg-violet-50 text-violet-600" },
    { label: "Delivered", value: stats?.deliveredOrders ?? 0, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
  ];

  const revenueStats = [
    { label: "Today", value: stats?.todayRevenue ?? 0 },
    { label: "This Week", value: stats?.weekRevenue ?? 0 },
    { label: "This Month", value: stats?.monthRevenue ?? 0 },
  ];

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-emerald-50 text-emerald-700";
      case "shipped": return "bg-violet-50 text-violet-700";
      case "processing": return "bg-blue-50 text-blue-700";
      case "pending": return "bg-amber-50 text-amber-700";
      case "cancelled": return "bg-red-50 text-red-700";
      default: return "bg-zinc-100 text-zinc-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Platform overview · {new Date().toLocaleDateString("en-PK", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <RefreshCw className={cn("h-5 w-5 text-zinc-600", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg mb-3", card.color)}>
              <card.icon className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <p className="text-2xl font-extrabold text-zinc-900">{card.value.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {orderStats.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg mb-3", card.color)}>
              <card.icon className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <p className="text-2xl font-extrabold text-zinc-900">{card.value.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.label} Orders</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold text-zinc-900">Revenue</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {revenueStats.map((r) => (
            <div key={r.label}>
              <p className="text-xs text-zinc-500">{r.label}</p>
              <p className="text-xl font-extrabold text-zinc-900">{formatCurrency(r.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-400">No orders yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">Customer</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500">Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50">
                  <td className="px-5 py-3 font-medium text-zinc-900">{order.orderNumber}</td>
                  <td className="px-5 py-3 text-zinc-600">{order.customerName}</td>
                  <td className="px-5 py-3 text-right font-medium text-zinc-900">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusColor(order.status))}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{new Date(order.createdAt).toLocaleDateString("en-PK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
