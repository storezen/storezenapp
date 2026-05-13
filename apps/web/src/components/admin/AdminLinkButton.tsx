import Link from "next/link";
import type { ComponentProps } from "react";
import { adminDenseLinkPrimaryClass, adminDenseLinkSecondaryClass } from "@/lib/admin-ui-tokens";
import { cn } from "@/lib/utils";

type Variant = "secondary" | "primary";

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  className?: string;
};

/**
 * `Link` with the same dimensions and weight as `Button` `size="dense"`.
 */
export function AdminLinkButton({ href, children, variant = "secondary", className, ...rest }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
        variant === "primary" ? adminDenseLinkPrimaryClass : adminDenseLinkSecondaryClass,
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
