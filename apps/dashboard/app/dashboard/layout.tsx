"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authFetch, clearToken, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/shipping", label: "Shipping" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/influencers", label: "Influencers" },
  { href: "/dashboard/themes", label: "Themes" },
  { href: "/dashboard/pages", label: "Pages" },
  { href: "/dashboard/coupons", label: "Coupons" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [storeName, setStoreName] = useState("Store");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    authFetch("/stores/my")
      .then((r) => r.json().catch(() => ({})))
      .then((data) => setStoreName(String(data?.name ?? "Store")))
      .catch(() => setStoreName("Store"));
  }, [router]);

  const mobileNav = useMemo(() => navItems.slice(0, 5), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <aside className="hidden md:block w-64 border-r border-slate-800 p-4">
          <div className="mb-6 text-lg font-semibold">{storeName}</div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm hover:bg-slate-800",
                  pathname === item.href && "bg-slate-800",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 pb-20 md:pb-6">
          <header className="border-b border-slate-800 p-4 flex items-center justify-between">
            <p className="font-medium">{storeName}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.open("/", "_blank")}>
                Preview
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  clearToken();
                  router.replace("/login");
                }}
              >
                Logout
              </Button>
            </div>
          </header>
          <div className="p-4">{children}</div>
        </main>
      </div>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950 grid grid-cols-5">
        {mobileNav.map((item) => (
          <Link key={item.href} href={item.href} className={cn("p-3 text-center text-xs", pathname === item.href && "text-indigo-400")}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
