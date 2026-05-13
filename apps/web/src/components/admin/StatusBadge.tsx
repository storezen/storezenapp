import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/admin-order-display";

const TONE: Record<BadgeTone, string> = {
  yellow: "border-amber-200/80 bg-amber-50/90 text-amber-900",
  green: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
  gray: "border-zinc-200/80 bg-zinc-100/90 text-zinc-700",
  red: "border-rose-200/80 bg-rose-50/90 text-rose-800",
};

type Props = { children: string; tone: BadgeTone; className?: string };

export function StatusBadge({ children, tone, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
