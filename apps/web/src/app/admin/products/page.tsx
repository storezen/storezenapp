"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit2, X, ChevronDown, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";
import { useAdminUI } from "@/contexts/AdminUIContext";
import type { Product } from "@/types";
import { AdminBulkActionBar } from "@/components/admin/shell/AdminBulkActionBar";
import { ProductFormPanel } from "@/components/admin/products/ProductFormPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { useConfirmModal } from "@/components/ui/notifications/modal-system";
import { SkeletonTable } from "@/components/ui/notifications/loading-states";

type Status = "all" | "active" | "draft";

export default function AdminProductsPage() {
  const { pushToast } = useAdminUI();
  const toast = useToast();
  const { confirm } = useConfirmModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkMenu, setBulkMenu] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      console.log("Loading admin products...");
      const data = await authFetch("/admin/products?limit=500") as { products?: Product[] };
      console.log("Products loaded:", data.products?.length);
      setProducts(data.products ?? []);
      const allTags = Array.from(new Set((data.products ?? []).flatMap((p) => p.tags ?? [])));
      setTagSuggestions(allTags);
      if (isRefresh) toast.success("Products refreshed");
    } catch (err) {
      console.error("Failed to load products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pushToast, toast]);

  useEffect(() => { void load(); }, [load]);

  const filtered = products.filter((p) => {
    if (status === "active" && (!p.is_active || p.is_draft)) return false;
    if (status === "draft" && !p.is_draft) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.category || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  async function bulkDelete() {
    confirm(
      `Are you sure you want to delete ${selected.size} product(s)? This action cannot be undone.`,
      async () => {
        try {
          await Promise.allSettled(
            Array.from(selected).map((id) => authFetch(`/products/${id}`, { method: "DELETE" })),
          );
          toast.success(`Deleted ${selected.size} product(s)`);
          setSelected(new Set());
          setBulkMenu(false);
          void load();
        } catch {
          toast.error("Bulk delete failed");
        }
      },
      "Delete Products"
    );
  }

  async function bulkActivate(active: boolean) {
    try {
      await Promise.allSettled(
        Array.from(selected).map((id) =>
          authFetch(`/products/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: active, isDraft: !active }) }),
        ),
      );
      pushToast(`${selected.size} product(s) ${active ? "activated" : "deactivated"}`);
      setSelected(new Set());
      setBulkMenu(false);
      void load();
    } catch {
      pushToast("Bulk update failed");
    }
  }

  function openCreate() {
    setEditing(null);
    setCreating(true);
  }

  function openEdit(p: Product) {
    setCreating(false);
    setEditing(p);
  }

  function closePanel() {
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title text-2xl font-extrabold text-zinc-900">Products</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{products.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add product
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      <AdminBulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <div className="relative">
          <Button
            type="button"
            size="dense"
            className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setBulkMenu((v) => !v)}
          >
            Actions
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
          {bulkMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                onClick={() => bulkActivate(true)}
              >
                Activate selected
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                onClick={() => bulkActivate(false)}
              >
                Deactivate selected
              </button>
              <div className="border-t border-white/10" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                onClick={bulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                Delete selected
              </button>
            </div>
          )}
        </div>
      </AdminBulkActionBar>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
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
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {(["all", "active", "draft"] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                status === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-500">Product</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-500">Status</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-zinc-500">Price</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-zinc-500">Stock</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-500">Category</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-500">Tags</th>
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="px-3 py-3"><div className="h-4 w-4 animate-pulse rounded bg-zinc-200" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-32 animate-pulse rounded bg-zinc-200" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-16 animate-pulse rounded bg-zinc-200" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-16 animate-pulse rounded bg-zinc-200 ml-auto" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-12 animate-pulse rounded bg-zinc-200 ml-auto" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-20 animate-pulse rounded bg-zinc-200" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-24 animate-pulse rounded bg-zinc-200" /></td>
                  <td />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-zinc-400">No products found</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className={cn("border-b border-zinc-50", selected.has(p.id) && "bg-zinc-50")}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="h-4 w-4" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.length ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover bg-zinc-100" />
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{p.name}</p>
                        {p.sku && <p className="text-xs text-zinc-400">{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      p.is_draft ? "bg-zinc-100 text-zinc-600" : "bg-emerald-50 text-emerald-700",
                    )}>
                      {p.is_draft ? "Draft" : "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {p.sale_price ? (
                      <span className="text-zinc-500 line-through">{formatCurrency(p.price)}</span>
                    ) : null}
                    <span className={cn("ml-1 font-medium", p.sale_price ? "text-red-600" : "text-zinc-900")}>
                      {formatCurrency(p.sale_price ?? p.price)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {(p.stock ?? 0) === 0 ? (
                      <span className="text-xs font-medium text-red-500">Out of stock</span>
                    ) : (p.stock ?? 0) <= (p.low_stock_threshold ?? 5) ? (
                      <span className="text-xs font-medium text-amber-600">{(p.stock ?? 0)} left</span>
                    ) : (
                      <span className="text-zinc-700">{p.stock ?? 0}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{p.category || "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">{t}</span>
                      ))}
                      {p.tags && p.tags.length > 2 && (
                        <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">+{p.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer / Panel for create/edit */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative ml-auto w-full max-w-2xl overflow-y-auto bg-white shadow-xl lg:max-w-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3">
              <h2 className="font-semibold text-zinc-900">{editing ? "Edit product" : "New product"}</h2>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-4">
              <ProductFormPanel
                mode={editing ? "edit" : "create"}
                product={editing}
                tagSuggestions={tagSuggestions}
                onCancel={closePanel}
                onSaved={() => { closePanel(); void load(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
