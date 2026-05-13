"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/api";
import {
  Users,
  Eye,
  ShoppingCart,
  Package,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Heart,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Filter,
  X,
  Calendar,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";

type IntentCounts = { viewing: number; interested: number; highIntent: number };
type LiveVisitors = { total: number; products: Record<string, number> };
type TrendingProduct = { productId: string; productName?: string; productImage?: string; views: number; carts: number; purchases: number };
type ActivityItem = { id: string; type: string; intent: string; productId?: string; productName?: string; orderId?: string; amount?: number; timestamp: number };
type Session = { sessionId: string; currentPage?: string; lastActive: number; productId?: string; productName?: string };
type Product = { id: string; name: string; images?: string[] };

const EVENT_TYPES = [
  { value: "all", label: "All" },
  { value: "page_view", label: "Page Views" },
  { value: "product_view", label: "Product Views" },
  { value: "add_to_cart", label: "Add to Cart" },
  { value: "begin_checkout", label: "Checkout" },
  { value: "purchase", label: "Purchase" },
  { value: "search", label: "Search" },
  { value: "wishlist", label: "Wishlist" },
];

export default function AccountLivePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  // State
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitors>({ total: 0, products: {} });
  const [intentCounts, setIntentCounts] = useState<IntentCounts>({ viewing: 0, interested: 0, highIntent: 0 });
  const [intentCounts24h, setIntentCounts24h] = useState<IntentCounts>({ viewing: 0, interested: 0, highIntent: 0 });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [trending, setTrending] = useState<TrendingProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; total: number; payment_method: string; createdAt: string; order_status: string; customer_name?: string }>>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activityFilter, setActivityFilter] = useState("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrderCountRef = useRef(0);
  const prevRefreshing = useRef(false);
  const activitiesEndRef = useRef<HTMLDivElement>(null);

  // Get storeId from user
  const storeId = user?.storeId || "default";

  // Fetch all data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) prevRefreshing.current = true;
    setRefreshing(true);
    try {
      const [visitorsRes, intentRes, intent24hRes, trendingRes, ordersRes, activitiesRes, productsRes] = await Promise.all([
        authFetch(`/events/visitors?storeId=${storeId}`).catch(() => ({ total: 0, products: {} })),
        authFetch(`/events/intent?storeId=${storeId}`).catch(() => ({ viewing: 0, interested: 0, highIntent: 0 })),
        authFetch(`/events/intent?storeId=${storeId}&hours=24`).catch(() => ({ viewing: 0, interested: 0, highIntent: 0 })),
        authFetch(`/events/trending?storeId=${storeId}&hours=1`).catch(() => ({ trending: [] })),
        authFetch("/orders?limit=15").catch(() => ({ orders: [] })),
        authFetch(`/events/activity?storeId=${storeId}&limit=50`).catch(() => ({ activities: [] })),
        authFetch("/products?limit=100").catch(() => ({ products: [] })),
      ]);

      setLiveVisitors(visitorsRes as LiveVisitors);
      setIntentCounts(intentRes as IntentCounts);
      setIntentCounts24h(intent24hRes as IntentCounts);

      // Map product names to trending
      const productList = (productsRes as { products?: Product[] })?.products || [];
      setProducts(productList);
      const trendingData = (trendingRes as { trending?: TrendingProduct[] })?.trending || [];
      const trendingWithNames = trendingData.map(t => {
        const product = productList.find(p => p.id === t.productId || p.id === t.productId?.replace(/-/g, ' '));
        return {
          ...t,
          productName: product?.name || t.productId,
          productImage: product?.images?.[0],
        };
      });
      setTrending(trendingWithNames);

      // Map product names to activities
      const activitiesData = (activitiesRes as { activities?: ActivityItem[] })?.activities || [];
      const activitiesWithNames = activitiesData.map(a => {
        if (a.productId) {
          const product = productList.find(p => p.id === a.productId || p.id === a.productId?.replace(/-/g, ' '));
          return { ...a, productName: product?.name || a.productId };
        }
        return a;
      });
      setActivities(activitiesWithNames);

      // Orders
      const ordersData = (ordersRes as { orders?: Array<{ id: string; total: number; payment_method: string; createdAt: string; order_status: string; customer_name?: string }> })?.orders || [];
      setRecentOrders(ordersData.slice(0, 15));

      // New order notification
      if (ordersData.length > prevOrderCountRef.current && prevOrderCountRef.current > 0 && soundEnabled) {
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 3000);
      }
      prevOrderCountRef.current = ordersData.length;

      // Active sessions from visitors
      const visitors = visitorsRes as LiveVisitors;
      const sessions: Session[] = Object.entries(visitors.products || {}).slice(0, 10).map(([productId, count], idx) => {
        const product = productList.find(p => p.id === productId || p.id === productId?.replace(/-/g, ' '));
        return {
          sessionId: `session_${idx + 1}`,
          currentPage: `/products/${productId}`,
          lastActive: Date.now() - Math.random() * 60000,
          productId,
          productName: product?.name || productId,
        };
      });
      setActiveSessions(sessions);

      setLastUpdate(new Date());
    } catch (e) {
      console.error("Failed to fetch live data", e);
      toast.error("Failed to load live data");
    } finally {
      setRefreshing(false);
      if (prevRefreshing.current) {
        toast.success("Live data refreshed");
        prevRefreshing.current = false;
      }
    }
  }, [storeId, soundEnabled, toast]);

  // Filter activities
  useEffect(() => {
    if (activityFilter === "all") {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(a => a.type === activityFilter));
    }
  }, [activities, activityFilter]);

  // Initial load
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, fetchData]);

  // Auto-scroll activities
  useEffect(() => {
    if (activitiesEndRef.current) {
      activitiesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activities]);

  // Activity config
  const getActivityConfig = (type: string, intent: string) => {
    const configs: Record<string, { icon: typeof Eye; color: string; label: string; emoji: string }> = {
      "page_view": { icon: Eye, color: "text-blue-600 bg-blue-50", label: "Page View", emoji: "👀" },
      "product_view": { icon: Eye, color: "text-emerald-600 bg-emerald-50", label: "Product View", emoji: "🛍️" },
      "add_to_cart": { icon: ShoppingCart, color: "text-amber-600 bg-amber-50", label: "Add to Cart", emoji: "🛒" },
      "begin_checkout": { icon: Zap, color: "text-orange-600 bg-orange-50", label: "Checkout", emoji: "⚡" },
      "purchase": { icon: Package, color: "text-violet-600 bg-violet-50", label: "Purchase", emoji: "✅" },
      "search": { icon: Search, color: "text-cyan-600 bg-cyan-50", label: "Search", emoji: "🔍" },
      "wishlist": { icon: Heart, color: "text-rose-600 bg-rose-50", label: "Wishlist", emoji: "❤️" },
    };
    return configs[type] || { icon: Activity, color: "text-zinc-600 bg-zinc-50", label: "Activity", emoji: "🔔" };
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getTimeOnSite = (lastActive: number) => {
    const seconds = Math.floor((Date.now() - lastActive) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "viewing": return "bg-emerald-500";
      case "interested": return "bg-amber-500";
      case "highIntent": return "bg-violet-500";
      default: return "bg-zinc-500";
    }
  };

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading live dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-lg">
            <Bell className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">New Order Received!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-600" />
            Live View
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time updates
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-400">Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              soundEnabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
            )}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </button>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* TOP ROW: Live Visitors + Intent Levels with 24h comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Live Visitors */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Live Visitors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Users className="h-4 w-4 text-emerald-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 flex items-center gap-2">
            {liveVisitors.total}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </p>
          <p className="text-xs text-zinc-500 mt-1">Active now</p>
        </div>

        {/* Viewing */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Viewing</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Eye className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900">{intentCounts.viewing}</p>
          <div className="flex items-center gap-1 mt-1">
            {(() => {
              const change = getPercentageChange(intentCounts.viewing, intentCounts24h.viewing);
              return (
                <>
                  {change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn("text-xs font-medium", change >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {Math.abs(change)}% vs 24h
                  </span>
                </>
              );
            })()}
          </div>
          {/* Intent Distribution Bar */}
          <div className="mt-3 h-1.5 bg-zinc-100 rounded-full overflow-hidden flex">
            <div className="bg-blue-500" style={{ width: `${(intentCounts.viewing / (intentCounts.viewing + intentCounts.interested + intentCounts.highIntent || 1)) * 100}%` }} />
            <div className="bg-amber-500" style={{ width: `${(intentCounts.interested / (intentCounts.viewing + intentCounts.interested + intentCounts.highIntent || 1)) * 100}%` }} />
            <div className="bg-violet-500" style={{ width: `${(intentCounts.highIntent / (intentCounts.viewing + intentCounts.interested + intentCounts.highIntent || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Interested */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Interested</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <ShoppingCart className="h-4 w-4 text-amber-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900">{intentCounts.interested}</p>
          <div className="flex items-center gap-1 mt-1">
            {(() => {
              const change = getPercentageChange(intentCounts.interested, intentCounts24h.interested);
              return (
                <>
                  {change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn("text-xs font-medium", change >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {Math.abs(change)}% vs 24h
                  </span>
                </>
              );
            })()}
          </div>
        </div>

        {/* High Intent */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">High Intent</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <Zap className="h-4 w-4 text-violet-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900">{intentCounts.highIntent}</p>
          <div className="flex items-center gap-1 mt-1">
            {(() => {
              const change = getPercentageChange(intentCounts.highIntent, intentCounts24h.highIntent);
              return (
                <>
                  {change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn("text-xs font-medium", change >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {Math.abs(change)}% vs 24h
                  </span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Total Active Sessions */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50">
              <Activity className="h-4 w-4 text-zinc-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900">{activeSessions.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Active sessions</p>
        </div>
      </div>

      {/* SECOND ROW: Activity Feed (Left) + Trending (Right) */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Activity Feed - 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Activity Feed
            </h2>
            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                {EVENT_TYPES.slice(0, 4).map(type => (
                  <button
                    key={type.value}
                    onClick={() => setActivityFilter(type.value)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                      activityFilter === type.value
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-400">{filteredActivities.length} events</span>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No recent activity</p>
                <p className="text-xs text-zinc-400 mt-1">Activity will appear here in real-time</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {filteredActivities.map((activity, idx) => {
                  const config = getActivityConfig(activity.type, activity.intent);
                  const Icon = config.icon;
                  return (
                    <div key={activity.id || idx} className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-50/50 transition-colors">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", config.color)}>
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-900 flex items-center gap-2">
                          <span className="text-lg">{config.emoji}</span>
                          {activity.type === "product_view" && (
                            <span>Viewing <span className="font-medium">{activity.productName || activity.productId}</span></span>
                          )}
                          {activity.type === "add_to_cart" && (
                            <span>Added to cart <span className="font-medium">{activity.productName || activity.productId}</span></span>
                          )}
                          {activity.type === "begin_checkout" && (
                            <span>Checkout started {activity.orderId && <span className="font-medium">#{activity.orderId.slice(-6)}</span>}</span>
                          )}
                          {activity.type === "purchase" && (
                            <span>Order completed {activity.orderId && <span className="font-medium">#{activity.orderId.slice(-6)}</span>}</span>
                          )}
                          {activity.type === "search" && (
                            <span>Searched for <span className="font-medium">{activity.productId}</span></span>
                          )}
                          {activity.type === "wishlist" && (
                            <span>Added to wishlist <span className="font-medium">{activity.productName || activity.productId}</span></span>
                          )}
                          {activity.type === "page_view" && <span>Viewing page</span>}
                        </p>
                        {activity.amount && (
                          <p className="text-xs text-zinc-500">{formatCurrency(activity.amount)}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-zinc-400">{formatTime(activity.timestamp)}</span>
                        <span className={cn("w-2 h-2 rounded-full", getIntentColor(activity.intent))} />
                      </div>
                    </div>
                  );
                })}
                <div ref={activitiesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Trending Products */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              Trending (1h)
            </h2>
          </div>
          {trending.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No trending yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {trending.map((item, idx) => (
                <div key={item.productId} className="flex items-center gap-3 px-5 py-3">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                    idx === 0 ? "bg-amber-100 text-amber-700" :
                    idx === 1 ? "bg-zinc-100 text-zinc-600" :
                    idx === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-zinc-50 text-zinc-400"
                  )}>
                    {idx + 1}
                  </div>
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.productName || item.productId}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {item.views}</span>
                      <span className="flex items-center gap-0.5"><ShoppingCart className="h-3 w-3" /> {item.carts}</span>
                      <span className="flex items-center gap-0.5"><CheckCircle className="h-3 w-3" /> {item.purchases}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* THIRD ROW: Live Orders + Active Sessions */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Live Orders */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              Recent Orders
            </h2>
            <Link href="/account/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              View All →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No orders yet</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50/50 sticky top-0">
                  <tr>
                    <th className="px-5 py-2 text-left text-xs font-semibold text-zinc-500">Order</th>
                    <th className="px-5 py-2 text-left text-xs font-semibold text-zinc-500">Customer</th>
                    <th className="px-5 py-2 text-right text-xs font-semibold text-zinc-500">Amount</th>
                    <th className="px-5 py-2 text-left text-xs font-semibold text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">#{order.id?.slice(-8)}</td>
                      <td className="px-5 py-3 text-zinc-600 text-xs">{order.customer_name || "—"}</td>
                      <td className="px-5 py-3 text-right font-medium text-zinc-900">{formatCurrency(order.total)}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
                          order.order_status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                          order.order_status === "shipped" ? "bg-violet-50 text-violet-700" :
                          order.order_status === "confirmed" ? "bg-blue-50 text-blue-700" :
                          order.order_status === "cancelled" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        )}>
                          {order.order_status === "pending" && <Clock className="h-3 w-3" />}
                          {order.order_status === "delivered" && <CheckCircle className="h-3 w-3" />}
                          {order.order_status || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Active Sessions
            </h2>
          </div>
          {activeSessions.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No active sessions</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <div className="divide-y divide-zinc-50">
                {activeSessions.map((session, idx) => (
                  <div key={session.sessionId || idx} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <span className="text-sm font-medium text-blue-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={session.currentPage || "#"} className="text-sm font-medium text-zinc-900 hover:text-emerald-600 truncate block">
                        {session.productName || session.productId || "Homepage"}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        Session: {session.sessionId?.slice(0, 10)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                      <p className="text-xs text-zinc-400">{getTimeOnSite(session.lastActive)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Products Grid (Product-wise visitors) */}
      {Object.keys(liveVisitors.products).length > 0 && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-emerald-600" />
            Live on Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(liveVisitors.products).map(([productId, count]) => {
              const product = products.find(p => p.id === productId || p.id === productId?.replace(/-/g, ' '));
              return (
                <div key={productId} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                    <span className="text-xs font-bold text-emerald-700">{count}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-900 truncate">{product?.name || productId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}