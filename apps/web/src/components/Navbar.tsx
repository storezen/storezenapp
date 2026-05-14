"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X, ChevronDown, Sparkles } from "lucide-react";
import { STORE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Collections", href: "/products", sub: ["Smartwatches", "Earbuds", "Accessories", "Audio"] },
  { label: "Track Order", href: "/track" },
  { label: "Contact", href: "/contact" },
];

const POPULAR_SEARCHES = ["Smartwatch", "Earbuds", "Power Bank", "Car Charger"];

export function Navbar() {
  const { items } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<"en" | "ur">("en");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ur") setLang("ur");
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen, searchOpen]);

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const toggleLang = useCallback(() => {
    const next = lang === "en" ? "ur" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
    window.location.reload();
  }, [lang]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [searchQuery, router]);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Top Bar - All Screens */}
      <div className="bg-zinc-950 px-3 py-1 text-center text-[10px] tracking-wide text-white/80 md:py-1.5 md:text-[11px]">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          {lang === "en"
            ? "Free Delivery on Orders Above Rs. 2,000 · COD Available All Pakistan · Parcel Open Allowed"
            : "2,000 روپے سے اوپر کے آرڈر پر مفت ڈیلیوری · پورے پاکستان میں کیش آن ڈیلیوری · پارسل کھول کر چیک کریں"}
        </span>
        <button
          type="button"
          onClick={toggleLang}
          className="ml-4 rounded-md border border-white/20 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/10"
        >
          {lang === "en" ? "اردو" : "EN"}
        </button>
      </div>

      {/* Main Nav */}
      <motion.header
        className={cn(
          "sticky top-0 z-40 border-b border-transparent bg-white/95 backdrop-blur-xl transition-all duration-300",
          scrolled && "border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        )}
        initial={false}
      >
        <div className="shop-container relative flex h-14 items-center justify-between md:h-[60px]">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-900 transition-colors hover:bg-zinc-100 active:scale-95 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-zinc-900 transition-opacity hover:opacity-80 md:text-xl"
          >
            {STORE_NAME || "Storezen"}
            <span className="text-emerald-600">PK</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-0.5 text-sm font-medium text-zinc-700 md:flex">
            {NAV_LINKS.map((link) => {
              const hasSub = !!link.sub?.length;
              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => hasSub && setHovered(link.label)}
                  onMouseLeave={() => hasSub && setHovered(null)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {link.label}
                    {hasSub && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          hovered === link.label && "rotate-180"
                        )}
                      />
                    )}
                  </Link>
                  <AnimatePresence>
                    {hovered === link.label && hasSub && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                        className="absolute left-0 top-full z-50 min-w-[200px] origin-top-left rounded-xl border border-zinc-200/80 bg-white p-1.5 shadow-xl shadow-zinc-900/5"
                      >
                        {link.sub!.map((s) => (
                          <Link
                            key={s}
                            href={`/products?category=${encodeURIComponent(s.toLowerCase())}`}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                            onClick={() => setHovered(null)}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                            {s}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search Trigger (Desktop) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 text-xs text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 md:flex"
              aria-label="Search"
            >
              <Search className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden lg:inline">Search...</span>
              <kbd className="ml-1 hidden rounded border border-zinc-200 bg-white px-1 py-0.5 text-[10px] font-mono text-zinc-400 lg:inline-block">
                ⌘K
              </kbd>
            </button>

            {/* Search Trigger (Mobile) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.75} />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-sm"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </motion.span>
              )}
            </Link>

            {/* Account */}
            <Link
              href="/login"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:flex"
              aria-label="Account"
            >
              <User className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-2xl md:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4">
                <Link href="/" onClick={() => setMobileOpen(false)} className="text-lg font-extrabold tracking-tight text-zinc-900">
                  {STORE_NAME || "Storezen"}
                  <span className="text-emerald-600">PK</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Collections</p>
                  <ul className="mt-2 space-y-0.5">
                    {["Smartwatches", "Earbuds", "Accessories", "Audio"].map((s) => (
                      <li key={s}>
                        <Link
                          href={`/products?category=${encodeURIComponent(s.toLowerCase())}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                          {s}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
              <div className="border-t border-zinc-100 p-3">
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-center text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
                  >
                    Account
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    WhatsApp Us
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh] px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl shadow-black/20"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" strokeWidth={1.75} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search for products, brands, categories..."
                  className="h-16 w-full bg-transparent pl-14 pr-14 text-lg text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <span className="text-xs font-mono">ESC</span>
                </button>
              </form>
              <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Popular Searches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSearchQuery(s);
                        searchInputRef.current?.focus();
                      }}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                        searchQuery === s
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}