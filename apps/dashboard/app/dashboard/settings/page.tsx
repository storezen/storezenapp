"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DashboardSettingsPage() {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    authFetch("/stores/my").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      setName(String(d?.name ?? ""));
      setLogo(String(d?.logo ?? ""));
    });
  }, []);

  async function save() {
    await authFetch("/stores/my", { method: "PUT", body: JSON.stringify({ name, logo }) });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Store Settings</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" />
        <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="Logo URL" />
        <Button onClick={save}>Save Settings</Button>
      </CardContent>
    </Card>
  );
}
