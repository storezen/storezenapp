"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DashboardWhatsappPage() {
  const [template, setTemplate] = useState("Order received: {{order_id}}");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Flow Toggles</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-2">
          <label className="border border-slate-800 rounded p-2 text-sm"><input type="checkbox" defaultChecked /> Order Received</label>
          <label className="border border-slate-800 rounded p-2 text-sm"><input type="checkbox" defaultChecked /> Order Confirmed</label>
          <label className="border border-slate-800 rounded p-2 text-sm"><input type="checkbox" defaultChecked /> Delivered</label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Template Editor</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
          <Button>Save Template</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Message Logs</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-slate-400">Connect logs endpoint to render WhatsApp history here.</p></CardContent>
      </Card>
    </div>
  );
}
