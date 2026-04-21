"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DashboardThemesPage() {
  const [theme, setTheme] = useState("minimal");
  const [primary, setPrimary] = useState("#4f46e5");

  return (
    <Card>
      <CardHeader><CardTitle>Theme Selector & Colors</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme name" />
        <Input value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="Primary color hex" />
        <div className="h-10 rounded" style={{ backgroundColor: primary }} />
        <Button>Save Theme</Button>
      </CardContent>
    </Card>
  );
}
