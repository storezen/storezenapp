"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentPropsWithoutRef<"input">, "type" | "ref"> & {
  indeterminate?: boolean;
};

export function SelectAllCheckbox({ className, indeterminate, checked, ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn("h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900/20", className)}
      checked={checked}
      {...props}
    />
  );
}
