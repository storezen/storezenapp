"use client";

import Link from "next/link";

type Props = {
  cartCount: number;
  onCartOpen: () => void;
};

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/products", label: "Products", icon: "◫" },
  { href: "/track", label: "Track", icon: "◎" },
  { href: "/login", label: "Account", icon: "◉" },
];

export function MobileNav({ cartCount, onCartOpen }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
      <div className="grid grid-cols-5">
        {items.slice(0, 2).map((item) => (
          <Link key={item.label} href={item.href} className="flex min-h-[56px] flex-col items-center justify-center text-[11px] text-gray-700">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button onClick={onCartOpen} className="relative flex min-h-[56px] flex-col items-center justify-center text-[11px] text-gray-700">
          <span className="text-base">◍</span>
          Cart
          {cartCount > 0 ? (
            <span className="absolute right-4 top-2 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">{cartCount}</span>
          ) : null}
        </button>
        {items.slice(2).map((item) => (
          <Link key={item.label} href={item.href} className="flex min-h-[56px] flex-col items-center justify-center text-[11px] text-gray-700">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
