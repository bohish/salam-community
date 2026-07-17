import { Skeleton } from "@/components/Skeleton";

const PlayerDetailSkeleton = () => (
  <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
    <Skeleton className="h-4 w-40" />
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <Skeleton className="h-[440px] rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);

export default PlayerDetailSkeleton;
