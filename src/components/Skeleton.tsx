export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-shimmer rounded-xl ${className}`} />
);

export const PlayerRowSkeleton = () => (
  <div className="glass rounded-2xl p-3 flex items-center gap-3">
    <Skeleton className="w-12 h-16 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
    <Skeleton className="h-6 w-11" />
  </div>
);

export const PlayerCardSkeleton = () => (
  <div className="card-premium rounded-2xl p-3">
    <Skeleton className="w-full h-40 mb-3" />
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
      <Skeleton className="h-6 w-12" />
    </div>
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: any;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) => (
  <div className="glass rounded-3xl py-14 px-6 text-center animate-fade-in">
    {Icon && (
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-7 h-7 text-primary" />
      </div>
    )}
    <p className="font-black text-base text-foreground">{title}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">{hint}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
