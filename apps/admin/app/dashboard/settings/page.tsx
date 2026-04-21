"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch("/admin/settings")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        setMaintenance(Boolean(d?.maintenanceMode));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await adminFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ maintenanceMode: maintenance }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
          Maintenance Mode
        </label>
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
      </CardContent>
    </Card>
  );
}
