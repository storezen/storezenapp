import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  rows?: number;
  className?: string;
};

/** Placeholder for admin list / table views while data loads. */
export function AdminTableSkeleton({ rows = 8, className }: Props) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 md:block">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 max-w-md" />
                <Skeleton className="h-3 w-1/3 max-w-xs" />
              </div>
              <Skeleton className="h-8 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-3 h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
