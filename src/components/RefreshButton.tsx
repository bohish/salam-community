import { useEffect, useState } from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

/** Formats "قبل X" relative to now in Arabic. */
const timeAgo = (ts: number | null): string => {
  if (!ts) return "لم يُحدَّث بعد";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `قبل ${s} ثانية`;
  const m = Math.floor(s / 60);
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.floor(h / 24)} يوم`;
};

interface Props {
  /** Query key prefixes to invalidate. Default: FUT.GG + FC26 sources. */
  keys?: string[][];
  className?: string;
}

/**
 * Manual refresh trigger with a live "last updated" label.
 * Invalidates the given React Query key prefixes to force a refetch.
 */
const RefreshButton = ({
  keys = [["futgg"], ["fc26"]],
  className = "",
}: Props) => {
  const qc = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => {
    const v = localStorage.getItem("futmac:lastRefresh");
    return v ? Number(v) : Date.now();
  });
  const [, tick] = useState(0);

  // Re-render every 30s so the "قبل X" label stays fresh.
  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const handle = async () => {
    await Promise.all(
      keys.map((k) => qc.invalidateQueries({ queryKey: k }))
    );
    const now = Date.now();
    localStorage.setItem("futmac:lastRefresh", String(now));
    setLastUpdated(now);
    toast.success("جارٍ تحديث البيانات...");
  };

  return (
    <div className={`flex items-center gap-2 text-[11px] text-muted-foreground ${className}`}>
      <span className="tabular-nums">آخر تحديث: {timeAgo(lastUpdated)}</span>
      <button
        onClick={handle}
        disabled={isFetching}
        className="glass hover:glass-strong rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 font-bold text-foreground transition-fluid disabled:opacity-60"
        aria-label="تحديث البيانات"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-primary ${isFetching ? "animate-spin" : ""}`} />
        تحديث
      </button>
    </div>
  );
};

export default RefreshButton;
