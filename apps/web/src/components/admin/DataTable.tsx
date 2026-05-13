import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Adds subtle zebra striping on body rows. */
  zebra?: boolean;
  /** Min width class on the inner `<table>` (wide tables for desktop). */
  tableMinWidthClass?: string;
};

/**
 * Shared admin table shell: zinc border, compact rows; pair with mobile card lists (`md:hidden` / `hidden md:block`).
 */
export function DataTable({ children, className, zebra, tableMinWidthClass = "min-w-[960px]" }: Props) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse text-left text-xs leading-tight text-zinc-800",
            tableMinWidthClass,
            zebra && "[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-zinc-50/70",
          )}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

type HeadProps = { children: React.ReactNode; className?: string };
export function DataTableHead({ children, className }: HeadProps) {
  return (
    <thead>
      <tr
        className={cn(
          "border-b border-zinc-200 bg-zinc-50/90 text-[10px] font-semibold uppercase tracking-wide text-zinc-500",
          className,
        )}
      >
        {children}
      </tr>
    </thead>
  );
}

export function DataTableTh({
  children,
  className,
  narrow,
  align,
}: HeadProps & { narrow?: boolean; align?: "right" | "left" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-3 py-2.5 first:pl-4 last:pr-4",
        align === "right" && "text-right",
        align === "center" && "text-center",
        narrow && "w-0",
        className,
      )}
    >
      {children}
    </th>
  );
}

type RowProps = {
  children: React.ReactNode;
  onRowClick?: () => void;
  className?: string;
};

export function DataTableRow({ children, onRowClick, className }: RowProps) {
  return (
    <tr
      className={cn(
        "border-b border-zinc-100 last:border-0",
        onRowClick && "cursor-pointer transition-colors hover:bg-zinc-50/90",
        className,
      )}
      onClick={onRowClick}
      onKeyDown={
        onRowClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick();
              }
            }
          : undefined
      }
      tabIndex={onRowClick ? 0 : undefined}
    >
      {children}
    </tr>
  );
}

type TdProps = {
  children: React.ReactNode;
  className?: string;
  align?: "right" | "left" | "center";
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
};

export function DataTableTd({ children, className, align, onClick }: TdProps) {
  return (
    <td
      onClick={onClick}
      className={cn(
        "px-3 py-2 align-middle first:pl-4 last:pr-4",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}
