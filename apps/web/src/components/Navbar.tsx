"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STORE_NAME } from "@/lib/constants";
import { Input } from "@/components/ui/input";

type Props = {
  cartCount: number;
  onCartOpen: () => void;
};

export function Navbar({ cartCount, onCartOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-smooth ${scrolled ? "shadow-sm" : "border-b"}`}>
      <div className="shop-container flex h-14 items-center justify-between md:h-16">
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" className="heading-font text-lg font-extrabold text-primary md:text-xl">
          {STORE_NAME || "StorePK"}
        </Link>

        <form className="mx-6 hidden flex-1 md:block">
          <Input placeholder="Search products..." className="h-10" />
        </form>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-800 lg:flex">
          <Link className="hover:text-primary" href="/products">Products</Link>
          <Link className="hover:text-primary" href="/track">Track Order</Link>
          <Link className="hover:text-primary" href="/dashboard">Dashboard</Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 md:hidden"
            onClick={() => setMobileSearch((v) => !v)}
            aria-label="Open search"
          >
            ⌕
          </button>
          <Link href="/products" aria-label="Search" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">⌕</Link>
          <button className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 md:flex" aria-label="Wishlist">♡</button>
          <button className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 md:flex" aria-label="Account">◉</button>
          <button onClick={onCartOpen} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100" aria-label="Cart">
            ◍
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileSearch ? (
        <div className="border-t border-gray-200 px-4 py-3 md:hidden">
          <Input placeholder="Search products..." className="h-11" />
        </div>
      ) : null}

      {open ? (
        <div className="border-t bg-white md:hidden">
          <nav className="shop-container flex flex-col py-2 text-sm font-medium text-gray-800">
            <Link onClick={() => setOpen(false)} className="py-3" href="/products">Products</Link>
            <Link onClick={() => setOpen(false)} className="py-3" href="/track">Track Order</Link>
            <Link onClick={() => setOpen(false)} className="py-3" href="/dashboard">Dashboard</Link>
            <Link onClick={() => setOpen(false)} className="py-3" href="/login">Account</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
