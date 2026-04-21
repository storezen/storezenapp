"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "" });

  async function load() {
    const resp = await authFetch("/products");
    const data = await resp.json().catch(() => ({}));
    setRows(Array.isArray(data?.products) ? data.products : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await authFetch("/products", {
      method: "POST",
      body: JSON.stringify({ ...form, stock: 0, isActive: true, images: [] }),
    });
    setForm({ name: "", category: "", price: "", description: "" });
    load();
  }

  async function generateAI() {
    const resp = await authFetch("/ai/generate-description", {
      method: "POST",
      body: JSON.stringify({ name: form.name, category: form.category, features: [form.description] }),
    });
    const data = await resp.json().catch(() => ({}));
    setForm((p) => ({ ...p, description: String(data?.description ?? p.description) }));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Product Management</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={generateAI} variant="outline">Generate AI Description</Button>
            <Button onClick={save}>Save Product</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((p) => <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell>{p.price}</TableCell><TableCell>{p.stock}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
