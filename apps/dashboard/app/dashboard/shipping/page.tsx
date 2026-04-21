"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DashboardShippingPage() {
  const [courier, setCourier] = useState("postex");
  const [orderId, setOrderId] = useState("");
  const [tracking, setTracking] = useState<any[]>([]);

  useEffect(() => {
    authFetch("/shipping/sync", { method: "POST", body: JSON.stringify({}) }).catch(() => {});
  }, []);

  async function book() {
    await authFetch("/shipping/book", { method: "POST", body: JSON.stringify({ orderId, courier }) });
  }

  async function sync() {
    const r = await authFetch("/shipping/sync", { method: "POST", body: JSON.stringify({}) });
    const d = await r.json().catch(() => ({}));
    setTracking(Array.isArray(d?.shipments) ? d.shipments : []);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Courier Settings & Booking</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier" />
          <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
          <div className="flex gap-2">
            <Button onClick={book}>One-click Booking</Button>
            <Button variant="outline" onClick={sync}>Sync Tracking</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Tracking View</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {tracking.map((t, i) => <div key={i} className="border border-slate-800 rounded p-2 text-sm">{t.trackingNumber} - {t.status}</div>)}
          {tracking.length === 0 ? <p className="text-sm text-slate-400">No tracked shipments.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
