export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-shimmer rounded-xl ${className}`} />
);

export const PlayerRowSkeleton = () => (
  <div className="glass rounded-xl p-2.5 flex items-center gap-3">
    <Skeleton className="w-12 h-16 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
    <Skeleton className="h-5 w-10" />
  </div>
);

export const PlayerCardSkeleton = () => (
  <div className="card-premium rounded-2xl p-3">
    <Skeleton className="w-full h-40 mb-2" />
    <Skeleton className="h-3 w-2/3 mb-1.5" />
    <Skeleton className="h-2.5 w-1/2" />
  </div>
);
