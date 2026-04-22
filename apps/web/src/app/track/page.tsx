"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";

export default function TrackPage() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const q = new URLSearchParams();
      if (id) q.set("id", id);
      if (phone) q.set("phone", phone);
      const res = await apiFetch(`/orders/track?${q.toString()}`);
      setOrder((res as { order?: Order }).order ?? (res as Order));
    } catch {
      setOrder(null);
      setError("Order not found");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <h1 className="heading-font text-2xl font-semibold text-primary">Track Order</h1>
        <label className="block text-sm font-semibold text-gray-700">Order ID</label>
        <Input placeholder="Enter order ID" value={id} onChange={(e) => setId(e.target.value)} />
        <label className="block text-sm font-semibold text-gray-700">Phone (optional)</label>
        <Input placeholder="03XX XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button type="submit" className="w-full">Track</Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {order && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-card">
          <p><b>ID:</b> {order.id}</p>
          <p><b>Status:</b> {order.order_status}</p>
          <p><b>Total:</b> {order.total}</p>
          <OrderStatusTimeline currentStep={order.order_status || "placed"} />
        </div>
      )}
    </div>
  );
}
