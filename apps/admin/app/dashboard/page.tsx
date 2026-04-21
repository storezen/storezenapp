"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});

  useEffect(() => {
    adminFetch("/admin/stats")
      .then(async (r) => setStats((await r.json().catch(() => ({}))) ?? {}))
      .catch(() => setStats({}));
  }, []);

  const stores = Number(stats.totalStores ?? stats.stores ?? 0);
  const orders = Number(stats.totalOrders ?? stats.orders ?? 0);
  const revenue = Number(stats.totalRevenue ?? stats.revenue ?? 0);
  const users = Number(stats.totalUsers ?? stats.users ?? 0);
  const growth = Array.isArray(stats.growth) ? stats.growth : [];
  const maxOrders = Math.max(1, ...growth.map((g: any) => Number(g?.orders ?? 0)));

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Card><CardHeader><CardTitle>Stores</CardTitle></CardHeader><CardContent>{stores}</CardContent></Card>
        <Card><CardHeader><CardTitle>Orders</CardTitle></CardHeader><CardContent>{orders}</CardContent></Card>
        <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader><CardContent>Rs. {revenue}</CardContent></Card>
        <Card><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent>{users}</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Growth (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          {growth.length === 0 ? (
            <div className="h-48 rounded-md border border-slate-800 p-3 text-sm text-slate-400">No growth data yet.</div>
          ) : (
            <div className="h-48 rounded-md border border-slate-800 p-3">
              <div className="h-full flex items-end gap-1">
                {growth.map((g: any) => {
                  const ordersCount = Number(g?.orders ?? 0);
                  const height = Math.max(6, Math.round((ordersCount / maxOrders) * 100));
                  return (
                    <div
                      key={String(g?.day)}
                      className="flex-1 bg-indigo-500/70 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${String(g?.day)}: ${ordersCount} orders`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
