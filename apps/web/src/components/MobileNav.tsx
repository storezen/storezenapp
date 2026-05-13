"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Home, ShoppingBag, Package, User, ShoppingCart, MessageCircle, Search, Plus, X } from "lucide-react";
import { WHATSAPP } from "@/lib/constants";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Tab = {
  href: string;
  label: string;
  icon: React.ElementType;
  activeIcon?: React.ElementType;
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: ShoppingBag },
  { href: "/track", label: "Track", icon: Package },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Search sheet */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-white px-4 pb-6 pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-zinc-200" />
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-14 pr-14 text-base font-medium text-zinc-900 outline-none transition-colors focus:border-emerald-300 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Smartwatch", "Earbuds", "Power Bank", "Cable"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSearchQuery(s); }}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white/95 backdrop-blur-xl safe-bottom lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Haptic feedback line */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className="h-px w-12 rounded-full bg-zinc-300" />
        </div>

        <div className="flex items-stretch">
          {/* Main tabs */}
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-x-2 top-0 h-[2.5px] rounded-full bg-emerald-600"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.75}
                  className={cn("transition-colors", active ? "text-emerald-600" : "text-zinc-400")}
                />
                <span className={cn(active ? "text-emerald-600" : "text-zinc-400")}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Search button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold text-zinc-400 transition-colors"
          >
            <Search size={22} strokeWidth={1.75} className="text-zinc-400" />
            <span>Search</span>
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold text-zinc-400 transition-colors"
          >
            <div className="relative">
              <ShoppingCart size={22} strokeWidth={1.75} className="text-zinc-400" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -right-2 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white shadow-lg shadow-emerald-500/30"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </div>
            <span>Cart</span>
          </Link>

          {/* WhatsApp / Account */}
          {WHATSAPP ? (
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold text-emerald-600 transition-colors"
            >
              <MessageCircle size={22} strokeWidth={1.75} className="text-emerald-600" />
              <span>Help</span>
            </a>
          ) : (
            <Link
              href="/login"
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold transition-colors",
                isActive("/login") || pathname === "/account" ? "text-emerald-600" : "text-zinc-400",
              )}
            >
              {isActive("/login") && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-x-2 top-0 h-[2.5px] rounded-full bg-emerald-600"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <User size={22} strokeWidth={1.75} />
              <span>Account</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
