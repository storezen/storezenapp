"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Stats = { totalOrders?: number; totalRevenue?: number; products?: number; pendingOrders?: number };

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    authFetch("/stores/my/stats").then(async (r) => setStats((await r.json().catch(() => ({}))) ?? {}));
    authFetch("/orders").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      setOrders(Array.isArray(d?.orders) ? d.orders.slice(0, 6) : []);
    });
    authFetch("/products").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      setProducts(Array.isArray(d?.products) ? d.products : []);
    });
  }, []);

  const lowStock = products.filter((p) => Number(p.stock ?? 0) <= Number(p.lowStockThreshold ?? 5)).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent>{Number(stats.totalOrders ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader><CardContent>Rs. {Number(stats.totalRevenue ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Products</CardTitle></CardHeader><CardContent>{Number(stats.products ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pending</CardTitle></CardHeader><CardContent>{Number(stats.pendingOrders ?? 0)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}><TableCell>{o.id}</TableCell><TableCell>{o.customerName}</TableCell><TableCell>{o.orderStatus}</TableCell><TableCell>Rs. {o.total}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lowStock.length === 0 ? <p className="text-slate-400 text-sm">No low stock alerts.</p> : lowStock.map((p) => (
            <div key={p.id} className="text-sm border border-slate-800 rounded-md p-2">{p.name} - {p.stock} left</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
