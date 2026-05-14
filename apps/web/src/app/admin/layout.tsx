"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Store,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Zap,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminUIProvider } from "@/contexts/AdminUIContext";
import { GlobalLoadingOverlay } from "@/components/ui/notifications/loading-states";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
];

const bottomNavItems = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AdminUIProvider>
    <div className="flex h-screen bg-zinc-50/50">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-zinc-200 transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-56"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex h-14 items-center border-b border-zinc-100",
          sidebarCollapsed ? "justify-center px-2" : "px-4 gap-2.5"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/20">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">Admin</p>
              <p className="text-[10px] text-zinc-400 truncate">Storezen Platform</p>
            </div>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-white" : "text-zinc-500")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-2.5 border-t border-zinc-100 space-y-0.5">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors",
              sidebarCollapsed && "justify-center"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4.5 w-4.5" />
            ) : (
              <>
                <ChevronLeft className="h-4.5 w-4.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User Section */}
        <div className={cn(
          "p-2.5 border-t border-zinc-100",
          sidebarCollapsed ? "flex justify-center" : ""
        )}>
          {sidebarCollapsed ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-zinc-600">
                  {user.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <p className="font-bold text-zinc-900">Admin</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <nav className="p-2.5 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium",
                  active ? "bg-zinc-900 text-white" : "text-zinc-600"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between px-4 bg-white border-b border-zinc-200 lg:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 hover:bg-zinc-100 rounded-lg"
            >
              <Menu className="h-5 w-5 text-zinc-600" />
            </button>
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg w-64">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm text-zinc-700 placeholder-zinc-400 outline-none"
              />
              <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <button className="relative p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-zinc-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            {/* Quick Add */}
            <button className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
              <Package className="h-4 w-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-5">
          {children}
        </main>
      </div>
      <GlobalLoadingOverlay />
    </div>
    </AdminUIProvider>
  );
}