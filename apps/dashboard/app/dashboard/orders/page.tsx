"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  async function load() {
    const resp = await authFetch("/orders");
    const data = await resp.json().catch(() => ({}));
    setOrders(Array.isArray(data?.orders) ? data.orders : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await authFetch(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Orders Management</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.id}</TableCell>
                <TableCell>{o.customerName}</TableCell>
                <TableCell>{o.orderStatus}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "confirmed")}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "shipped")}>Ship</Button>
                  <Button size="sm" onClick={() => window.open(`https://wa.me/${String(o.customerPhone ?? "").replace(/\D/g, "")}`, "_blank")}>WhatsApp</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
