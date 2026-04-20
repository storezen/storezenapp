export function SkeletonCard() {
  return (
    <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded-md animate-pulse w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-6 bg-muted rounded-md animate-pulse w-16" />
          <div className="h-6 bg-muted rounded-md animate-pulse w-12" />
        </div>
        <div className="h-10 bg-muted rounded-lg animate-pulse w-full mt-2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="h-14 bg-card border-b border-border animate-pulse" />
      <div className="max-w-6xl mx-auto p-4 md:py-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <div className="aspect-square bg-muted rounded-xl animate-pulse" />
          <div className="flex gap-2 mt-3">
            {[0,1,2,3].map(i => <div key={i} className="w-16 h-16 bg-muted rounded-lg animate-pulse" />)}
          </div>
        </div>
        <div className="w-full md:w-1/2 space-y-4 pt-2">
          <div className="h-3 bg-muted rounded animate-pulse w-20" />
          <div className="h-10 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-6 bg-muted rounded animate-pulse w-32" />
          <div className="h-8 bg-muted rounded animate-pulse w-28" />
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-muted rounded animate-pulse w-16" />
            <div className="flex gap-2">
              {[0,1,2,3].map(i => <div key={i} className="w-12 h-10 bg-muted rounded-md animate-pulse" />)}
            </div>
          </div>
          <div className="h-14 bg-muted rounded-full animate-pulse w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Loading...</p>
      </div>
    </div>
  );
}
