"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  Eye,
  RefreshCw,
  Filter,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { SkeletonTable } from "@/components/ui/notifications/loading-states";
import type { Order } from "@/types";

type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  pendingOrders: number;
  deliveredOrders: number;
};

type SortOption = "recent" | "orders" | "spent" | "name";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchCustomers = () => {
    setRefreshing(true);
    authFetch("/orders")
      .then((r: unknown) => {
        const data = r as { orders?: Order[] };
        const orderList = data.orders ?? [];

        // Group orders by customer (using phone as unique identifier)
        const customerMap = new Map<string, CustomerSummary>();

        orderList.forEach((order) => {
          const phone = order.customer_phone;
          if (!phone) return;

          const existing = customerMap.get(phone);
          const orderTotal = Number(order.total);

          if (existing) {
            existing.totalOrders += 1;
            existing.totalSpent += orderTotal;
            if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
              existing.lastOrderDate = order.created_at;
            }
            if (["pending", "confirmed", "processing", "shipped"].includes(order.order_status ?? "")) {
              existing.pendingOrders += 1;
            }
            if (order.order_status === "delivered") {
              existing.deliveredOrders += 1;
            }
          } else {
            customerMap.set(phone, {
              id: phone,
              name: order.customer_name || "Unknown",
              phone: phone,
              city: order.customer_city || "Unknown",
              totalOrders: 1,
              totalSpent: orderTotal,
              lastOrderDate: order.created_at,
              pendingOrders: ["pending", "confirmed", "processing", "shipped"].includes(order.order_status ?? "") ? 1 : 0,
              deliveredOrders: order.order_status === "delivered" ? 1 : 0,
            });
          }
        });

        setOrders(orderList);
        setCustomers(Array.from(customerMap.values()));
        if (orderList.length === 0) {
          toast.info("No customers found");
        }
      })
      .catch(() => {
        toast.error("Failed to load customers");
        setCustomers([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Get unique cities for filter
  const cities = Array.from(new Set(customers.map((c) => c.city).filter(Boolean))).sort();

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.city.toLowerCase().includes(search.toLowerCase());
      const matchesCity = filterCity === "all" || c.city === filterCity;
      return matchesSearch && matchesCity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        case "orders":
          return b.totalOrders - a.totalOrders;
        case "spent":
          return b.totalSpent - a.totalSpent;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Top customers by spent
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  // Get customer tier
  const getTier = (customer: CustomerSummary) => {
    if (customer.totalSpent >= 100000) return { label: "VIP", color: "bg-amber-100 text-amber-700", icon: Star };
    if (customer.totalOrders >= 5) return { label: "Regular", color: "bg-emerald-100 text-emerald-700", icon: TrendingUp };
    return { label: "New", color: "bg-zinc-100 text-zinc-600", icon: Users };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">View and manage your customer database</p>
        </div>
        <Button variant="outline" onClick={fetchCustomers} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{totalCustomers}</p>
              <p className="text-xs text-zinc-500">Total Customers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-zinc-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
              </p>
              <p className="text-xs text-zinc-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{formatCurrency(avgSpent)}</p>
              <p className="text-xs text-zinc-500">Avg. Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Top Customers by Spending</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topCustomers.map((customer, index) => {
            const tier = getTier(customer);
            const TierIcon = tier.icon;
            return (
              <div
                key={customer.id}
                className="p-4 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 truncate text-sm">{customer.name}</p>
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium", tier.color)}>
                      <TierIcon className="h-2.5 w-2.5" />
                      {tier.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">{customer.totalOrders} orders</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(customer.totalSpent)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700"
          >
            <option value="recent">Most Recent</option>
            <option value="orders">Most Orders</option>
            <option value="spent">Highest Spent</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
          <Users className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900">No customers found</h3>
          <p className="mt-2 text-sm text-zinc-500">
            {search || filterCity !== "all" ? "Try changing the filters" : "Customers will appear here after placing orders"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Location</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Total Spent</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.map((customer) => {
                const tier = getTier(customer);
                const TierIcon = tier.icon;

                return (
                  <tr key={customer.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/account/customers/${customer.id}`} className="flex items-center gap-3 hover:text-emerald-600">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-medium">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{customer.name}</p>
                          <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium", tier.color)}>
                            <TierIcon className="h-2.5 w-2.5" />
                            {tier.label}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-sm text-zinc-600 hover:text-emerald-600">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-zinc-600">
                        <MapPin className="h-3 w-3" />
                        {customer.city}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium text-zinc-900">{customer.totalOrders}</span>
                        {customer.pendingOrders > 0 && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                            {customer.pendingOrders} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        customer.pendingOrders > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      )}>
                        {customer.pendingOrders > 0 ? "Active" : "Complete"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-emerald-600">{formatCurrency(customer.totalSpent)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-500">
                      {customer.lastOrderDate
                        ? new Date(customer.lastOrderDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}