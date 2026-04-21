"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminStoresPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const r = await adminFetch("/admin/stores");
    const d = await r.json().catch(() => ({}));
    setRows(Array.isArray(d?.stores) ? d.stores : Array.isArray(d) ? d : []);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => rows.filter((s) => String(s.name ?? "").toLowerCase().includes(q.toLowerCase()) || String(s.slug ?? "").toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );

  async function toggle(id: string) {
    await adminFetch(`/admin/stores/${id}/toggle`, { method: "PUT", body: JSON.stringify({}) });
    load();
  }

  async function plan(id: string, value: string) {
    await adminFetch(`/admin/stores/${id}/plan`, { method: "PUT", body: JSON.stringify({ plan: value }) });
    load();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Stores</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Search by store name or slug" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="overflow-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead>Plan</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.slug}</TableCell>
                  <TableCell>{s.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <select className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1" value={s.plan ?? "free"} onChange={(e) => plan(s.id, e.target.value)}>
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                      <option value="business">business</option>
                    </select>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" onClick={() => toggle(s.id)}>{s.isActive ? "Deactivate" : "Activate"}</Button>
                    <Button onClick={() => window.open(`/${s.slug}`, "_blank")}>View Store</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
