"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, Filter, Download, MoreVertical, Eye, ChevronDown, ArrowUpDown, MessageCircle, Copy, ChevronRight, X, XCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WHATSAPP } from "@/lib/constants";
import { getStatusConfig } from "@/lib/order-status";
import { cn, formatCurrency } from "@/lib/utils";
import { useAdminUI } from "@/contexts/AdminUIContext";
import { useToast } from "@/components/ui/notifications/toast-system";
import { SkeletonTable } from "@/components/ui/notifications/loading-states";

type Order = {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_city?: string;
  total: number;
  order_status?: string;
  payment_method?: string;
  payment_status?: string;
  createdAt: string;
  itemCount?: number;
};

type Status = "all" | "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
type SortKey = "createdAt" | "total" | "customer_name";
type SortDir = "asc" | "desc";

export default function AdminOrdersPage() {
  const { pushToast } = useAdminUI();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await authFetch("/orders?limit=500") as { orders?: Order[] };
      setOrders((data.orders ?? []) as Order[]);
      if (isRefresh) toast.success("Orders refreshed");
    } catch {
      setOrders([]);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const filtered = orders
    .filter((o) => {
      if (status !== "all" && o.order_status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !o.id.toLowerCase().includes(q) &&
          !(o.customer_name ?? "").toLowerCase().includes(q) &&
          !(o.customer_phone ?? "").includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case "total": cmp = (a.total ?? 0) - (b.total ?? 0); break;
        case "customer_name": cmp = (a.customer_name ?? "").localeCompare(b.customer_name ?? ""); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const handleBulkStatus = async (newStatus: string) => {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    try {
      const ids = Array.from(selected);
      await authFetch("/orders/bulk-status", {
        method: "POST",
        body: JSON.stringify({ ids, status: newStatus }),
      });
      pushToast(`Updated ${ids.length} orders to ${newStatus}`);
      setSelected(new Set());
      void load();
    } catch (err) {
      pushToast("Failed to update orders");
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Orders</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" className="h-11 gap-2 rounded-xl font-semibold">
            <Download className="h-4 w-4" strokeWidth={2} />
            Export
          </Button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className={cn("h-5 w-5 text-zinc-600", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {[
          { key: "all", label: "All", count: orders.length, color: "bg-zinc-50 text-zinc-600" },
          { key: "pending", label: "Pending", count: orders.filter((o) => o.order_status === "pending").length, color: "bg-amber-50 text-amber-600" },
          { key: "confirmed", label: "Confirmed", count: orders.filter((o) => o.order_status === "confirmed").length, color: "bg-blue-50 text-blue-600" },
          { key: "processing", label: "Processing", count: orders.filter((o) => o.order_status === "processing").length, color: "bg-violet-50 text-violet-600" },
          { key: "shipped", label: "Shipped", count: orders.filter((o) => o.order_status === "shipped").length, color: "bg-indigo-50 text-indigo-600" },
          { key: "delivered", label: "Delivered", count: orders.filter((o) => o.order_status === "delivered").length, color: "bg-emerald-50 text-emerald-600" },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key as Status)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl border p-3 transition-all",
              status === key
                ? "border-emerald-200/60 bg-emerald-50/50 shadow-sm"
                : "border-zinc-200/80 bg-white hover:border-zinc-300",
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
            <span className={cn("text-lg font-extrabold", status === key ? "text-emerald-700" : "text-zinc-900")}>{count}</span>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium tabular-nums">{selected.size} selected</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={() => handleBulkStatus("confirmed")}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Confirm
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={() => handleBulkStatus("shipped")}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Ship
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={() => handleBulkStatus("delivered")}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Delivered
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, name, phone…"
            className="h-10 pl-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>

        <Button
          variant="secondary"
          size="md"
          className="h-10 gap-2 rounded-xl text-xs font-semibold"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter className="h-4 w-4" strokeWidth={2} />
          Filters
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", filterOpen && "rotate-180")} strokeWidth={2} />
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("customer_name")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Customer
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Payment</th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("total")}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Total
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Date
                  </button>
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ShoppingCart className="mx-auto h-10 w-10 text-zinc-300" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-medium text-zinc-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const meta = getStatusConfig(order.order_status ?? "pending");
                  const Icon = meta.icon;
                  return (
                    <tr
                      key={order.id}
                      className={cn("group border-b border-zinc-50 transition-colors hover:bg-zinc-50/50", selected.has(order.id) && "bg-emerald-50/30")}
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" className="h-4 w-4" checked={selected.has(order.id)} onChange={() => toggle(order.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-mono text-[12px] text-zinc-400">#{order.id?.slice(0, 12)}</p>
                          <p className="font-medium text-zinc-900">{order.customer_name || "—"}</p>
                          <p className="text-xs text-zinc-500">{order.customer_phone}{order.customer_city ? ` · ${order.customer_city}` : ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", meta.bg, meta.color)}>
                          <Icon className="h-3 w-3" strokeWidth={2} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.payment_status === "paid" ? "success" : "warning"} className="text-[10px]">
                          {order.payment_status === "paid" ? "Paid" : "COD"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums font-bold text-zinc-900">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === order.id ? null : order.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <MoreVertical className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <AnimatePresence>
                            {openMenu === order.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xl"
                              >
                                <Link
                                    href={`/admin/orders/${order.id}`}
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                                  >
                                    <Eye className="h-4 w-4 text-zinc-400" strokeWidth={2} />
                                    View Details
                                  </Link>
                                <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50">
                                  <Copy className="h-4 w-4 text-zinc-400" strokeWidth={2} />
                                  Copy Order ID
                                </button>
                                {WHATSAPP && order.customer_phone && (
                                  <a
                                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi ${order.customer_name}, your order #${order.id} is being processed`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-500/10"
                                  >
                                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                                    Send WhatsApp
                                  </a>
                                )}
                                <div className="border-t border-zinc-100" />
                                <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                                  <XCircle className="h-4 w-4" strokeWidth={2} />
                                  Cancel Order
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
          <p className="text-xs text-zinc-500">{selected.size > 0 ? `${selected.size} selected` : `${filtered.length} orders`}</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs font-medium">Previous</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs font-medium">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
