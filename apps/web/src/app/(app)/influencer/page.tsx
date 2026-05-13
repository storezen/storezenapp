"use client";

import { useEffect, useState } from "react";
import { Gift, Link2, Package, TrendingUp, User } from "lucide-react";
import { authFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type InfluencerStats = {
  name: string;
  refCode: string;
  commissionPercent: string;
  totalClicks: number;
  totalOrders: number;
  totalCommission: number;
};

export default function InfluencerPortalPage() {
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const storeSlug = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

  useEffect(() => {
    setLoading(true);
    authFetch("/influencer/me")
      .then((r: unknown) => {
        const data = r as { influencer?: InfluencerStats };
        setStats(data.influencer ?? null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  async function copyReferralLink() {
    if (!stats) return;
    const link = `${window.location.origin}/?ref=${stats.refCode}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <User className="h-8 w-8 text-zinc-700" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Influencer Portal</h1>
        <p className="mt-2 text-zinc-600">
          Enter your referral code to access your dashboard
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            // For now, show message that access requires login
            alert("Please login or enter your referral code provided by the store.");
          }}
        >
          <input
            type="text"
            placeholder="Enter your referral code"
            className="h-12 w-full rounded-xl border border-zinc-300 px-4"
          />
          <Button className="w-full" size="lg">
            Access Dashboard
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <User className="h-8 w-8 text-zinc-700" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Welcome, {stats.name}</h1>
        <p className="mt-1 text-zinc-600">Your Influencer Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-emerald-700">Your Earnings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">
              {formatCurrency(stats.totalCommission)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-zinc-600">Total Clicks</p>
            <p className="mt-1 text-2xl font-bold">{stats.totalClicks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-zinc-600">Total Orders</p>
            <p className="mt-1 text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-zinc-600">Commission Rate</p>
            <p className="mt-1 text-2xl font-bold">{stats.commissionPercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg bg-zinc-100 p-3">
              <code className="text-sm">{window.location.origin}/?ref={stats.refCode}</code>
            </div>
            <Button onClick={copyReferralLink}>
              {linkCopied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Share this link to earn {stats.commissionPercent}% commission on all orders
          </p>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              1
            </div>
            <p>Share your unique referral link with friends and followers</p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              2
            </div>
            <p>When someone places an order through your link, you earn commission</p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              3
            </div>
            <p>Track your clicks, orders, and earnings on this dashboard</p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              4
            </div>
            <p>Get paid when you reach the minimum payout threshold</p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Button size="lg" onClick={() => window.open(`/products`, "_blank")}>
          <Package className="mr-2 h-5 w-5" />
          Browse Products to Share
        </Button>
      </div>
    </div>
  );
}