"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const r = await adminFetch("/admin/users");
    const d = await r.json().catch(() => ({}));
    setRows(Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : []);
  }

  useEffect(() => { load(); }, []);

  async function toggleBan(id: string) {
    await adminFetch(`/admin/users/${id}/ban`, { method: "PUT", body: JSON.stringify({}) });
    load();
  }

  async function changePlan(id: string, plan: string) {
    await adminFetch(`/admin/users/${id}/plan`, { method: "PUT", body: JSON.stringify({ plan }) });
    load();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <select className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1" value={u.plan ?? "free"} onChange={(e) => changePlan(u.id, e.target.value)}>
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="business">business</option>
                  </select>
                </TableCell>
                <TableCell>{u.isActive === false ? "Banned" : "Active"}</TableCell>
                <TableCell><Button variant="outline" onClick={() => toggleBan(u.id)}>{u.isActive === false ? "Unban" : "Ban"}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
