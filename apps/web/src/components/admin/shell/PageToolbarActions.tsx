import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  primaryLabel: string;
  onPrimary: () => void;
  /** Optional secondary (e.g. Export, More) */
  secondaries?: { label: string; onClick: () => void; variant?: "secondary" }[];
  className?: string;
  /** Extra nodes (e.g. custom) */
  children?: ReactNode;
};

export function PageToolbarActions({ primaryLabel, onPrimary, secondaries, className, children }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-1.5", className)} role="group">
      {secondaries?.map((s) => (
        <Button
          key={s.label}
          type="button"
          variant={s.variant === "secondary" || !s.variant ? "secondary" : "primary"}
          size="dense"
          className="font-medium"
          onClick={s.onClick}
        >
          {s.label}
        </Button>
      ))}
      {children}
      <Button
        type="button"
        size="dense"
        className="bg-zinc-900 font-semibold text-white shadow-sm hover:bg-zinc-800"
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    </div>
  );
}
