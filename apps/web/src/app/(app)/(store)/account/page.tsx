"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Plus,
  ArrowRight,
  PackageSearch,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Target,
  Zap,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { LoadingSpinner } from "@/components/ui/notifications/loading-states";
import type { Order, Product } from "@/types";

type IntentCounts = { viewing: number; interested: number; highIntent: number };
type TrendingProduct = { productId: string; views: number; carts: number; purchases: number };
type ActivityItem = { id: string; type: string; intent: string; productId?: string; orderId?: string; amount?: number; timestamp: number };

type StoreStats = {
  todayOrders: number;
  todayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

type DailyRevenue = {
  day: string;
  revenue: number;
  orders: number;
};

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [intentCounts, setIntentCounts] = useState<IntentCounts>({ viewing: 0, interested: 0, highIntent: 0 });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trending, setTrending] = useState<TrendingProduct[]>([]);
  const toast = useToast();

  const fetchData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    Promise.all([
      authFetch("/orders"),
      authFetch("/products?stats=true"),
    ])
      .then(([ordersRes, productsRes]) => {
        const ordersData = ordersRes as { orders?: Order[] };
        const productsData = productsRes as { products?: Product[] };

        const orderList = ordersData.orders ?? [];
        const productList = productsData.products ?? [];

        setOrders(orderList);
        setProducts(productList);

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayOrders = orderList.filter((o) => new Date(o.created_at) >= today);
        const weekOrders = orderList.filter((o) => new Date(o.created_at) >= weekAgo);
        const monthOrders = orderList.filter((o) => new Date(o.created_at) >= monthAgo);

        // Calculate daily revenue for last 7 days
        const last7Days: DailyRevenue[] = [];
        for (let i = 6; i >= 0; i--) {
          const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
          const dayOrders = orderList.filter(
            (o) => new Date(o.created_at) >= day && new Date(o.created_at) < dayEnd
          );
          last7Days.push({
            day: day.toLocaleDateString("en-PK", { weekday: "short" }),
            revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
            orders: dayOrders.length,
          });
        }
        setDailyRevenue(last7Days);

        // Stats calculation
        const pendingOrders = orderList.filter((o) => ["pending", "new"].includes(o.order_status ?? "")).length;
        const processingOrders = orderList.filter((o) => ["confirmed", "processing"].includes(o.order_status ?? "")).length;
        const shippedOrders = orderList.filter((o) => o.order_status === "shipped").length;
        const deliveredOrders = orderList.filter((o) => o.order_status === "delivered").length;

        const lowStock = productList.filter((p) => p.stock && p.stock > 0 && p.stock <= (p.low_stock_threshold || 5)).length;
        const outOfStock = productList.filter((p) => !p.stock || p.stock === 0).length;

        setStats({
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          weekOrders: weekOrders.length,
          weekRevenue: weekOrders.reduce((sum, o) => sum + Number(o.total), 0),
          monthOrders: monthOrders.length,
          monthRevenue: monthOrders.reduce((sum, o) => sum + Number(o.total), 0),
          totalProducts: productList.length,
          totalCustomers: new Set(orderList.map((o) => o.customer_phone)).size,
          pendingOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          lowStockProducts: lowStock,
          outOfStockProducts: outOfStock,
        });
      })
      .catch(() => {
        setOrders([]);
        setProducts([]);
        setStats({
          todayOrders: 0,
          todayRevenue: 0,
          weekOrders: 0,
          weekRevenue: 0,
          monthOrders: 0,
          monthRevenue: 0,
          totalProducts: 0,
          totalCustomers: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
        });
      })
      .catch(() => {
        toast.error("Failed to load dashboard data");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
        if (refreshing) toast.success("Dashboard refreshed");
      });
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.storeId) fetchData();
  }, [user?.storeId]);

  // Fetch live events data
  useEffect(() => {
    if (!user?.storeId) return;

    const fetchLiveData = async () => {
      try {
        const [intentRes, trendingRes] = await Promise.all([
          authFetch("/events/intent?storeId=default").catch(() => ({ viewing: 0, interested: 0, highIntent: 0 })),
          authFetch("/events/trending?storeId=default&hours=1").catch(() => ({ trending: [] })),
        ]);
        setIntentCounts(intentRes as IntentCounts);
        setTrending((trendingRes as { trending?: TrendingProduct[] })?.trending || []);
      } catch (e) { console.error("Failed to fetch live data", e); }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, [user?.storeId]);

  function getStatusColor(status: string | undefined) {
    switch (status) {
      case "delivered": return "bg-emerald-100 text-emerald-700";
      case "shipped": return "bg-violet-100 text-violet-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "processing": return "bg-blue-100 text-blue-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-amber-100 text-amber-700";
    }
  }

  // Calculate percentage changes (mock for demo)
  const revenueChange = 12.5;
  const ordersChange = 8.3;

  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Welcome back, {user.name}!</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open("/", "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Store
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push("/account/products/new")}>
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Quick Stats - Revenue & Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase text-zinc-400">Today&apos;s Revenue</span>
            <div className={cn("flex items-center gap-1 text-xs font-medium", revenueChange >= 0 ? "text-emerald-600" : "text-red-600")}>
              {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(revenueChange)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{formatCurrency(stats?.todayRevenue ?? 0)}</p>
          <p className="text-xs text-zinc-400 mt-1">{stats?.todayOrders ?? 0} orders today</p>
        </div>

        {/* Week Revenue */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase text-zinc-400">This Week</span>
            <div className={cn("flex items-center gap-1 text-xs font-medium", ordersChange >= 0 ? "text-emerald-600" : "text-red-600")}>
              {ordersChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(ordersChange)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{formatCurrency(stats?.weekRevenue ?? 0)}</p>
          <p className="text-xs text-zinc-400 mt-1">{stats?.weekOrders ?? 0} orders this week</p>
        </div>

        {/* Month Revenue */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase text-zinc-400">This Month</span>
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{formatCurrency(stats?.monthRevenue ?? 0)}</p>
          <p className="text-xs text-zinc-400 mt-1">{stats?.monthOrders ?? 0} orders this month</p>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase text-zinc-400">Customers</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.totalCustomers ?? 0}</p>
          <p className="text-xs text-zinc-400 mt-1">Unique customers</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Weekly Revenue</h2>
              <p className="text-sm text-zinc-500">Last 7 days</p>
            </div>
          </div>

          {loading ? (
            <div className="h-40 bg-zinc-100 rounded-lg animate-pulse" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2 h-32">
                {dailyRevenue.map((day, index) => {
                  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                        style={{ height: `${height}%`, minHeight: day.revenue > 0 ? "8px" : "0" }}
                      />
                      <span className="text-xs text-zinc-500">{day.day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div>
                  <p className="text-xs text-zinc-500">Total Revenue</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {formatCurrency(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total Orders</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {dailyRevenue.reduce((sum, d) => sum + d.orders, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Order Status</h2>

          <div className="space-y-4">
            {[
              { label: "Pending", value: stats?.pendingOrders ?? 0, color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
              { label: "Processing", value: stats?.processingOrders ?? 0, color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
              { label: "Shipped", value: stats?.shippedOrders ?? 0, color: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50" },
              { label: "Delivered", value: stats?.deliveredOrders ?? 0, color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
            ].map((item) => {
              const total = (stats?.pendingOrders ?? 0) + (stats?.processingOrders ?? 0) + (stats?.shippedOrders ?? 0) + (stats?.deliveredOrders ?? 0);
              const percentage = total > 0 ? (item.value / total) * 100 : 0;

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-600">{item.label}</span>
                    <span className="text-sm font-medium text-zinc-900">{item.value}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <Link href="/account/orders" className="mt-6">
            <Button variant="outline" className="w-full">
              View All Orders
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Products & Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-base font-semibold text-zinc-900">Recent Orders</h2>
            <Link href="/account/orders" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <PackageSearch className="h-10 w-10 text-zinc-300 mx-auto" />
              <p className="text-sm text-zinc-500 mt-2">No orders yet</p>
              <Link href="/products">
                <Button variant="outline" size="sm" className="mt-3">
                  Visit Store
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">#{order.id?.slice(-6)}</p>
                      <p className="text-sm text-zinc-500">
                        {order.customer_name} • {order.customer_city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-zinc-900">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(order.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(order.order_status))}>
                      {order.order_status || "pending"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-base font-semibold text-zinc-900">Top Products</h2>
            <Link href="/account/products" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-10 w-10 text-zinc-300 mx-auto" />
              <p className="text-sm text-zinc-500 mt-2">No products yet</p>
              <Button size="sm" className="mt-3" onClick={() => router.push("/account/products/new")}>
                Add First Product
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {products.slice(0, 5).map((product, index) => (
                <Link
                  key={product.id}
                  href={`/account/products/${product.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{product.name}</p>
                    <p className="text-sm text-zinc-500">
                      {product.stock ?? 0} in stock • {product.is_active !== false ? "Active" : "Draft"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900">{formatCurrency(product.sale_price ?? product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Alerts */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-500" />
            Inventory Alerts
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">{stats?.outOfStockProducts ?? 0}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">Out of Stock</p>
                  <p className="text-xs text-zinc-500">Products with 0 stock</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/account/products")}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-amber-600 font-bold text-sm">{stats?.lowStockProducts ?? 0}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">Low Stock</p>
                  <p className="text-xs text-zinc-500">Below threshold</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/account/products")}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-zinc-500" />
            Store Overview
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Total Products</span>
              <span className="font-medium text-zinc-900">{stats?.totalProducts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Total Orders</span>
              <span className="font-medium text-zinc-900">{orders.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Total Customers</span>
              <span className="font-medium text-zinc-900">{stats?.totalCustomers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Avg. Order Value</span>
              <span className="font-medium text-zinc-900">
                {orders.length > 0 ? formatCurrency(orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length) : formatCurrency(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-zinc-500" />
            Quick Actions
          </h2>

          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/account/products/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/account/orders")}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Pending Orders
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/account/customers")}>
              <Users className="h-4 w-4 mr-2" />
              View Customers
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/account/settings")}>
              <Target className="h-4 w-4 mr-2" />
              Store Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Timeline (Last 7 Days) */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-zinc-500" />
          Recent Activity
        </h2>

        {orders.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 8).map((order, index) => (
              <div key={order.id} className="flex items-center gap-4">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  order.order_status === "delivered" ? "bg-emerald-500" :
                  order.order_status === "cancelled" ? "bg-red-500" :
                  "bg-amber-500"
                )} />
                <div className="flex-1">
                  <p className="text-sm text-zinc-900">
                    New order <span className="font-medium">#{order.id?.slice(-6)}</span> from {order.customer_name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatCurrency(order.total)} • {order.customer_city}
                  </p>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(order.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIVE GROWTH SECTION - Real-time Store Activity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-zinc-900">Live Growth</h2>
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time
          </span>
        </div>

        {/* Intent Levels - Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium uppercase text-zinc-400">Viewing</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{intentCounts.viewing}</p>
            <p className="text-xs text-zinc-500">Browsing products</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium uppercase text-zinc-400">Interested</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{intentCounts.interested}</p>
            <p className="text-xs text-zinc-500">Added to cart</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium uppercase text-zinc-400">High Intent</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{intentCounts.highIntent}</p>
            <p className="text-xs text-zinc-500">Ready to buy</p>
          </div>
        </div>

        {/* Trending Products & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trending Products */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              Trending (1h)
            </h3>
            {trending.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No trending yet</p>
            ) : (
              <div className="space-y-3">
                {trending.slice(0, 5).map((item, idx) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold",
                      idx === 0 ? "bg-amber-100 text-amber-700" :
                      idx === 1 ? "bg-zinc-100 text-zinc-600" :
                      idx === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-zinc-50 text-zinc-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{item.productId}</p>
                      <p className="text-xs text-zinc-500">{item.views} views · {item.carts} carts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Orders */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              Recent Orders
            </h3>
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">#{order.id?.slice(-6)}</p>
                        <p className="text-xs text-zinc-500">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-900">{formatCurrency(order.total)}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        order.order_status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                        order.order_status === "shipped" ? "bg-violet-50 text-violet-700" :
                        order.order_status === "cancelled" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      )}>
                        {order.order_status || "pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}