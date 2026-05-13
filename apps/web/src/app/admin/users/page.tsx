"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  X,
  MoreVertical,
  Mail,
  Shield,
  ChevronDown,
  ArrowUpDown,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Crown,
  Zap,
  Store,
  RefreshCw,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { SkeletonTable } from "@/components/ui/notifications/loading-states";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  storeId?: string;
  storeName?: string;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
};

type Plan = "free" | "starter" | "growth" | "enterprise";
type SortKey = "name" | "email" | "createdAt" | "orderCount" | "totalSpent";
type SortDir = "asc" | "desc";

const PLAN_META: Record<Plan, { label: string; color: string; icon: React.ReactNode }> = {
  free: { label: "Free", color: "bg-zinc-100 text-zinc-600", icon: <User className="h-3 w-3" strokeWidth={2} /> },
  starter: { label: "Starter", color: "bg-blue-50 text-blue-600", icon: <Zap className="h-3 w-3" strokeWidth={2} /> },
  growth: { label: "Growth", color: "bg-emerald-50 text-emerald-600", icon: <ArrowUpDown className="h-3 w-3" strokeWidth={2} /> },
  enterprise: { label: "Enterprise", color: "bg-violet-50 text-violet-600", icon: <Crown className="h-3 w-3" strokeWidth={2} /> },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | "all">("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    authFetch("/admin/users")
      .then((r) => {
        const d = r as { users?: AdminUser[]; data?: AdminUser[] };
        setUsers((d.users ?? d.data ?? []) as AdminUser[]);
      })
      .catch(() => {
        toast.error("Failed to load users");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users
    .filter((u) => {
      if (selectedPlan !== "all" && (u.plan ?? "free") !== selectedPlan) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case "orderCount": cmp = (a.orderCount ?? 0) - (b.orderCount ?? 0); break;
        case "totalSpent": cmp = (a.totalSpent ?? 0) - (b.totalSpent ?? 0); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 text-zinc-300" strokeWidth={2} />;
    return sortDir === "asc"
      ? <ChevronDown className="h-3 w-3 text-zinc-500 rotate-180" strokeWidth={2} />
      : <ChevronDown className="h-3 w-3 text-zinc-500" strokeWidth={2} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Users</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{users.length} registered users</p>
        </div>
        <Button size="md" className="h-11 gap-2 rounded-xl font-bold shadow-lg shadow-zinc-900/10">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Export
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Users", value: users.length, sub: "+12 this week", icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Active Stores", value: users.filter((u) => u.storeId).length, sub: "merchants", icon: Store, color: "bg-emerald-50 text-emerald-600" },
          { label: "Free Users", value: users.filter((u) => (u.plan ?? "free") === "free").length, sub: "not converted", icon: User, color: "bg-zinc-50 text-zinc-600" },
          { label: "Premium", value: users.filter((u) => !["free", "starter"].includes(u.plan ?? "")).length, sub: "paid plans", icon: Crown, color: "bg-violet-50 text-violet-600" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", color)}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-zinc-900">{value}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
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

        <div className="flex flex-wrap gap-1.5">
          {(["all", "free", "starter", "growth", "enterprise"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlan(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                selectedPlan === p
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {p === "all" ? "All Plans" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    User <SortIcon k="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("email")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Email <SortIcon k="email" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Plan</th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Joined <SortIcon k="createdAt" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("orderCount")}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Orders <SortIcon k="orderCount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("totalSpent")}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Spent <SortIcon k="totalSpent" />
                  </button>
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-10 w-10 text-zinc-300" strokeWidth={1.5} />
                      <p className="mt-3 text-sm font-medium text-zinc-500">No users found</p>
                      <p className="mt-1 text-xs text-zinc-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const plan = (user.plan ?? "free") as Plan;
                  const planMeta = PLAN_META[plan] ?? PLAN_META.free;
                  return (
                    <tr
                      key={user.id}
                      className="group border-b border-zinc-50 transition-colors hover:bg-zinc-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                            {user.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">{user.name}</p>
                            {user.storeName && (
                              <p className="text-[11px] text-zinc-500">{user.storeName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-zinc-600">{user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", planMeta.color)}>
                          {planMeta.icon}
                          {planMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-zinc-500">
                          {new Date(user.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums font-medium text-zinc-900">{user.orderCount ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums font-medium text-zinc-900">
                          {user.totalSpent ? formatCurrency(user.totalSpent) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <MoreVertical className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <AnimatePresence>
                            {openMenu === user.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xl"
                              >
                                <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50">
                                  <Mail className="h-4 w-4 text-zinc-400" strokeWidth={2} />
                                  Send Email
                                </button>
                                <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50">
                                  <Shield className="h-4 w-4 text-zinc-400" strokeWidth={2} />
                                  Manage Permissions
                                </button>
                                <div className="border-t border-zinc-100" />
                                <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                                  <XCircle className="h-4 w-4" strokeWidth={2} />
                                  Suspend User
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

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
          <p className="text-xs text-zinc-500">
            Showing {filtered.length} of {users.length} users
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs font-medium">Previous</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs font-medium">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
