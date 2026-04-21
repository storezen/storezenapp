"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardInfluencersPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    authFetch("/influencers").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      setRows(Array.isArray(d?.influencers) ? d.influencers : Array.isArray(d) ? d : []);
    });
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Influencer Management</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Ref Code</TableHead><TableHead>Clicks</TableHead><TableHead>Orders</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.refCode}</TableCell>
                <TableCell>{r.totalClicks ?? 0}</TableCell>
                <TableCell>{r.totalOrders ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
