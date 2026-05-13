"use client";

import { useEffect, useState } from "react";
import { Store, Search, CheckCircle, XCircle, Eye, Mail, Calendar, Loader2, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { SkeletonTable } from "@/components/ui/notifications/loading-states";

type AdminStore = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPlan?: string;
};

export default function StoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const loadStores = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("search", search);

    authFetch(`/admin/stores?${params}`)
      .then((r) => {
        const data = r as { stores?: AdminStore[] };
        setStores(data.stores ?? []);
      })
      .catch(() => {
        toast.error("Failed to load stores");
        setStores([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStores();
  }, [filter, search]);

  const filteredStores = stores.filter(s => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerEmail?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const statusCounts = stores.reduce((acc, s) => {
    acc[s.isActive ? "active" : "inactive"] = (acc[s.isActive ? "active" : "inactive"] || 0) + 1;
    return acc;
  }, { active: 0, inactive: 0 } as Record<string, number>);

  async function handleToggle(id: string) {
    try {
      const updated = await authFetch(`/admin/stores/${id}/toggle`, { method: "PUT" }) as AdminStore;
      setStores(stores.map(s => s.id === id ? { ...s, isActive: updated.isActive } : s));
      toast.success("Store status updated");
    } catch {
      toast.error("Failed to update store status");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Stores</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage and approve stores on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={cn("rounded-xl border p-4 text-left transition-all", filter === "all" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:border-zinc-300")}
        >
          <p className="text-2xl font-bold">{stores.length}</p>
          <p className={cn("text-sm", filter === "all" ? "text-zinc-300" : "text-zinc-500")}>Total</p>
        </button>
        <button
          onClick={() => setFilter("active")}
          className={cn("rounded-xl border p-4 text-left transition-all", filter === "active" ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-200 bg-white hover:border-zinc-300")}
        >
          <p className="text-2xl font-bold">{statusCounts.active || 0}</p>
          <p className={cn("text-sm", filter === "active" ? "text-emerald-100" : "text-zinc-500")}>Active</p>
        </button>
        <button
          onClick={() => setFilter("inactive")}
          className={cn("rounded-xl border p-4 text-left transition-all", filter === "inactive" ? "border-red-500 bg-red-500 text-white" : "border-zinc-200 bg-white hover:border-zinc-300")}
        >
          <p className="text-2xl font-bold">{statusCounts.inactive || 0}</p>
          <p className={cn("text-sm", filter === "inactive" ? "text-red-100" : "text-zinc-500")}>Inactive</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search stores..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLoading(true);
          }}
          className="pl-10"
        />
      </div>

      {/* Loading or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
          <Store className="h-12 w-12 text-zinc-300" strokeWidth={1.25} />
          <p className="mt-4 text-base font-semibold text-zinc-900">No stores found</p>
          <p className="mt-1 text-sm text-zinc-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Store</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStores.map((store) => (
                <tr key={store.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{store.name}</p>
                        <p className="text-xs text-zinc-400">vendrix.pk/{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-zinc-900">{store.ownerName || "—"}</p>
                    <p className="text-xs text-zinc-500">{store.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-600">/{store.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                      store.ownerPlan === "growth" && "bg-violet-50 text-violet-700",
                      store.ownerPlan === "starter" && "bg-blue-50 text-blue-700",
                      (!store.ownerPlan || store.ownerPlan === "free") && "bg-zinc-100 text-zinc-600",
                    )}>
                      {store.ownerPlan || "free"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                      store.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                    )}>
                      {store.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-500">
                      {store.createdAt ? new Date(store.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={store.isActive ? "outline" : "primary"}
                        onClick={() => handleToggle(store.id)}
                      >
                        {store.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}