"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/stores", label: "Stores" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getAdminToken()) router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-slate-800 p-4 hidden md:block">
        <p className="font-semibold mb-4">Super Admin</p>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={cn("block px-3 py-2 rounded-md text-sm hover:bg-slate-800", pathname === n.href && "bg-slate-800")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Button
          variant="destructive"
          className="mt-6 w-full"
          onClick={() => {
            clearAdminToken();
            router.replace("/login");
          }}
        >
          Logout
        </Button>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
