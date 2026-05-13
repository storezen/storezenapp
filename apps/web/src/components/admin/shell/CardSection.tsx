import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Slightly emphasis for nested groups */
  variant?: "default" | "muted";
};

export function CardSection({ title, description, children, className, variant = "default" }: Props) {
  return (
    <section
      className={cn(
        "rounded-lg border p-3 shadow-sm",
        variant === "default" && "border-zinc-200 bg-white",
        variant === "muted" && "border-zinc-200 bg-zinc-50/50",
        className,
      )}
    >
      <p className="text-[12px] font-semibold text-zinc-900">{title}</p>
      {description ? <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p> : null}
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
