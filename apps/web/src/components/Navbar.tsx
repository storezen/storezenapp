"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STORE_NAME } from "@/lib/constants";

type Props = {
  cartCount: number;
  onCartOpen: () => void;
};

export function Navbar({ cartCount, onCartOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white transition-smooth ${scrolled ? "border-b border-border" : ""}`}>
      <div className="shop-container relative flex h-14 items-center justify-between md:h-16">
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" className="section-title absolute left-1/2 -translate-x-1/2 text-lg font-extrabold text-[#1a1a1a] md:static md:translate-x-0 md:text-xl md:flex-1">
          {STORE_NAME || "StorePK"}
        </Link>

        <nav className="hidden items-center justify-center gap-8 text-sm font-medium text-[#1a1a1a] md:flex md:flex-1">
          <Link className="hover:text-secondary" href="/">Home</Link>
          <Link className="hover:text-secondary" href="/products">Products</Link>
          <Link className="hover:text-secondary" href="/track">Track</Link>
          <Link className="hover:text-secondary" href="/login">Contact</Link>
        </nav>

        <div className="flex items-center justify-end gap-2 md:flex-1">
          <Link href="/products" aria-label="Search" className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-hover md:flex">
            <span className="text-lg">⌕</span>
          </Link>
          <button onClick={onCartOpen} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-hover" aria-label="Cart">
            <span className="text-lg">◍</span>
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-white md:hidden">
          <nav className="shop-container flex flex-col py-2 text-sm font-medium text-[#1a1a1a]">
            <Link onClick={() => setOpen(false)} className="py-3" href="/">Home</Link>
            <Link onClick={() => setOpen(false)} className="py-3" href="/products">Products</Link>
            <Link onClick={() => setOpen(false)} className="py-3" href="/track">Track</Link>
            <Link onClick={() => setOpen(false)} className="py-3" href="/login">Contact</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
