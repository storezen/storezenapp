"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  count: number;
  onClear: () => void;
  children?: React.ReactNode;
  className?: string;
};

/** Sticky bulk actions — appears when list rows are selected (Shopify-style). */
export function AdminBulkActionBar({ count, onClear, children, className }: Props) {
  if (count <= 0) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm font-medium tabular-nums">
        {count} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Button type="button" variant="secondary" size="dense" className="border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700" onClick={onClear}>
        <X className="mr-1 inline h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Clear
      </Button>
    </div>
  );
}
