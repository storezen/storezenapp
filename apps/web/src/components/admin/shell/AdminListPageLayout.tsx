import type { ReactNode } from "react";
import { adminPageLeadClass, adminPageTitleClass } from "@/lib/admin-ui-tokens";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  description?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Standard merchant list page: title, optional toolbar, content on a soft card surface.
 */
export function AdminListPageLayout({ title, description, filters, actions, children, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h1 className={adminPageTitleClass}>{title}</h1>
        {description ? <p className={adminPageLeadClass}>{description}</p> : null}
      </div>
      {(filters != null && filters !== false) || actions ? (
        <Card className="border-zinc-200/90 shadow-sm">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 flex-wrap gap-2">{filters}</div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div> : null}
          </div>
        </Card>
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
