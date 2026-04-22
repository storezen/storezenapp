export function SkeletonCard() {
  return (
    <div className="flex flex-col bg-card border border-card-border rounded-lg overflow-hidden">
      <div className="aspect-[3/4] sw-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 sw-shimmer rounded w-1/2" />
        <div className="h-4 sw-shimmer rounded w-3/4" />
        <div className="flex gap-2 mt-1">
          <div className="h-5 sw-shimmer rounded w-16" />
          <div className="h-5 sw-shimmer rounded w-12" />
        </div>
        <div className="h-10 sw-shimmer rounded w-full mt-2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="h-14 bg-card border-b border-border sw-shimmer" />
      <div className="max-w-6xl mx-auto p-4 md:py-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <div className="aspect-[3/4] bg-muted rounded-lg sw-shimmer" />
          <div className="flex gap-2 mt-3">
            {[0,1,2,3].map(i => <div key={i} className="w-16 h-16 sw-shimmer rounded" />)}
          </div>
        </div>
        <div className="w-full md:w-1/2 space-y-4 pt-2">
          <div className="h-3 sw-shimmer rounded w-20" />
          <div className="h-10 sw-shimmer rounded w-3/4" />
          <div className="h-6 sw-shimmer rounded w-32" />
          <div className="h-8 sw-shimmer rounded w-28" />
          <div className="h-4 sw-shimmer rounded w-full" />
          <div className="h-4 sw-shimmer rounded w-5/6" />
          <div className="space-y-2 pt-2">
            <div className="h-4 sw-shimmer rounded w-16" />
            <div className="flex gap-2">
              {[0,1,2,3].map(i => <div key={i} className="w-12 h-10 sw-shimmer rounded" />)}
            </div>
          </div>
          <div className="h-12 sw-shimmer rounded w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
}
