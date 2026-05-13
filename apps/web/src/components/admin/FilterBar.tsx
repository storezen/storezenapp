"use client";

import { cn } from "@/lib/utils";
import type { OrderScope } from "@/lib/admin-order-display";

const SCOPE_OPTIONS: { value: OrderScope; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "action", label: "Needs action" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "issues", label: "Cancelled or returned" },
];

type Props = {
  scope: OrderScope;
  onScopeChange: (v: OrderScope) => void;
  tableQuery: string;
  onTableQueryChange: (v: string) => void;
  className?: string;
};

export function FilterBar({ scope, onScopeChange, tableQuery, onTableQueryChange, className }: Props) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3", className)}>
      <div className="shrink-0">
        <label className="sr-only" htmlFor="orders-scope">
          Order list
        </label>
        <select
          id="orders-scope"
          value={scope}
          onChange={(e) => onScopeChange(e.target.value as OrderScope)}
          className="h-9 max-w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 shadow-sm outline-none transition hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-300/30"
        >
          {SCOPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="orders-table-search">
          Filter in list
        </label>
        <input
          id="orders-table-search"
          type="search"
          autoComplete="off"
          placeholder="Filter by name, phone, or order #…"
          value={tableQuery}
          onChange={(e) => onTableQueryChange(e.target.value)}
          className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 placeholder:text-zinc-400 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-300/30"
        />
      </div>
    </div>
  );
}
