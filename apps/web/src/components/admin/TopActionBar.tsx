"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onExport: () => void;
  onCreateOrder: () => void;
  onMore?: () => void;
  className?: string;
};

export function TopActionBar({ onExport, onCreateOrder, onMore, className }: Props) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-1.5 sm:gap-2", className)}
      role="group"
      aria-label="Order actions"
    >
      {onMore ? (
        <Button type="button" variant="secondary" size="dense" className="font-medium" onClick={onMore}>
          More actions
        </Button>
      ) : null}
      <Button type="button" variant="secondary" size="dense" className="font-medium" onClick={onExport}>
        Export
      </Button>
      <Button type="button" size="dense" className="font-semibold shadow-sm" onClick={onCreateOrder}>
        Create order
      </Button>
    </div>
  );
}
