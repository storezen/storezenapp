import Link from "next/link";
import type { ReactNode } from "react";

export const CATEGORY_ITEMS = [
  { name: "Smart Watches", q: "watch", count: "30+ items", icon: "smartwatch" as const },
  { name: "AirPods", q: "airpod", count: "7+ items", icon: "airpods" as const },
  { name: "Straps", q: "strap", count: "39+ items", icon: "straps" as const },
  { name: "Cases", q: "case", count: "44+ items", icon: "cases" as const },
  { name: "Headphones", q: "headphone", count: "6+ items", icon: "headphones" as const },
  { name: "Accessories", q: "accessory", count: "9+ items", icon: "accessories" as const },
] as const;

export type CategoryIconId = (typeof CATEGORY_ITEMS)[number]["icon"];

const iconClass = "h-11 w-11 sm:h-12 sm:w-12 text-zinc-900";

function CategoryGlyph({ id }: { id: CategoryIconId }): ReactNode {
  switch (id) {
    case "smartwatch":
      return (
        <svg className={iconClass} viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect x="19" y="6" width="10" height="6" rx="1.2" fill="currentColor" />
          <rect x="19" y="36" width="10" height="6" rx="1.2" fill="currentColor" />
          <rect
            x="12"
            y="10"
            width="24"
            height="28"
            rx="4"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24 20v4l2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "airpods":
      return (
        <svg className={iconClass} viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect x="6" y="20" width="10" height="16" rx="2.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="32" y="20" width="10" height="16" rx="2.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 20v-3c0-2.5 2-4.5 4-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M39 20v-3c0-2.5-2-4.5-4-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M11 20c0-3 2.2-4.5 3.5-4.5M37 20c0-3-2.2-4.5-3.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "straps":
      return (
        <svg className={iconClass} viewBox="0 0 48 48" fill="none" aria-hidden>
          <ellipse
            cx="16"
            cy="20"
            rx="6"
            ry="4"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="1.4"
            transform="rotate(-35 16 20)"
          />
          <ellipse
            cx="32"
            cy="28"
            rx="6"
            ry="4"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="1.4"
            transform="rotate(-35 32 28)"
          />
          <path d="M20 22.5c2.5 2.5 5.5 4 8.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "cases":
      return (
        <svg className={iconClass} viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect x="14" y="8" width="20" height="32" rx="2.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="17" y="12" width="14" height="20" rx="0.6" fill="currentColor" fillOpacity="0.15" />
          <circle cx="20" cy="16" r="0.7" fill="currentColor" fillOpacity="0.45" />
          <circle cx="24" cy="16" r="0.7" fill="currentColor" fillOpacity="0.45" />
          <circle cx="28" cy="16" r="0.7" fill="currentColor" fillOpacity="0.45" />
          <circle cx="20" cy="20" r="0.7" fill="currentColor" fillOpacity="0.5" />
          <circle cx="24" cy="20" r="0.7" fill="currentColor" fillOpacity="0.5" />
          <circle cx="28" cy="20" r="0.7" fill="currentColor" fillOpacity="0.5" />
          <rect x="19" y="36" width="10" height="1.2" rx="0.3" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
    case "headphones":
      return (
        <svg className={iconClass} viewBox="0 0 48 48" fill="none" aria-hidden>
          <line x1="28" y1="10" x2="28" y2="32" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="20" cy="34" rx="4.2" ry="2.8" fill="currentColor" transform="rotate(-25 20 34)" />
          <path
            d="M28 9c2.2 0.3 4.2 0 4.2 0s2-0.2 1.2 2.2c-0.4 1-1.3 1.3-1.3 1.3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "accessories":
      return (
        <svg className={iconClass} viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect x="20" y="6" width="8" height="8" rx="0.5" fill="currentColor" />
          <path d="M20 6V4.5A1.5 1.5 0 0 1 24 4" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <path d="M28 6V4.5A1.5 1.5 0 0 0 24 4" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <path d="M21.5 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M22 16v5M26 16v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export type CategoryCardProps = {
  href: string;
  name: string;
  count: string;
  iconId: CategoryIconId;
};

export function CategoryCard({ href, name, count, iconId }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex aspect-square max-h-[148px] min-h-[120px] flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3 text-center transition-smooth hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-100/80 hover:shadow-md sm:max-h-[160px] sm:min-h-[132px] sm:p-4"
    >
      <div className="mb-0.5 flex h-12 shrink-0 items-center justify-center sm:h-14">
        <CategoryGlyph id={iconId} />
      </div>
      <p className="mt-1.5 text-center text-[13px] font-bold leading-tight text-zinc-900 sm:text-sm">{name}</p>
      <p className="mt-0.5 text-center text-xs text-zinc-500">{count}</p>
    </Link>
  );
}

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {CATEGORY_ITEMS.map((cat) => (
        <CategoryCard
          key={cat.name}
          href={`/products?q=${encodeURIComponent(cat.q)}`}
          name={cat.name}
          count={cat.count}
          iconId={cat.icon}
        />
      ))}
    </div>
  );
}
