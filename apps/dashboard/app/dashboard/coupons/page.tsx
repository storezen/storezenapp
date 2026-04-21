"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardCouponsPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Coupons</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">Coupon CRUD panel scaffolded here. Wire to `/coupons` APIs as next step.</p>
      </CardContent>
    </Card>
  );
}
