"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const blocks = ["Hero", "Featured Products", "Reviews", "FAQ", "Footer"];

export default function DashboardPagesBuilderPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Page Builder (Basic Drag & Drop)</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-slate-400">Drag-and-drop scaffold (phase 1 visual placeholders).</p>
        {blocks.map((b) => (
          <div key={b} draggable className="rounded-md border border-slate-800 p-3 cursor-move">
            {b}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
