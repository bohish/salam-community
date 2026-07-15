import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import PlayerListRow from "@/components/PlayerListRow";
import AdvancedFilters, { DEFAULT_FILTERS, applyFilters, type FiltersState } from "@/components/AdvancedFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerRowSkeleton } from "@/components/Skeleton";
import { usePlayerPool } from "@/hooks/useFc26";

const PAGE = 20;

const PlayersPage = () => {
  const pool = usePlayerPool(150);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [open, setOpen] = useState(true);
  const [limit, setLimit] = useState(PAGE);

  const results = useMemo(() => applyFilters(pool.data ?? [], filters), [pool.data, filters]);
  const visible = results.slice(0, limit);

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <Helmet>
        <title>استكشاف اللاعبين — FUTHUB FC 26</title>
        <meta name="description" content="استكشف لاعبي EA FC 26 بفلاتر متقدمة: تقييم، مركز، نادي، دوري، منتخب، عمر، طول." />
      </Helmet>

      <Breadcrumbs items={[{ label: "استكشاف اللاعبين" }]} />

      <h1 className="text-2xl font-black mb-1">استكشاف اللاعبين</h1>
      <p className="text-xs text-muted-foreground mb-4">
        {pool.isLoading ? "جاري تحميل المجموعة..." : `${results.length} لاعب من أصل ${pool.data?.length ?? 0}`}
      </p>

      <AdvancedFilters
        value={filters}
        onChange={(v) => { setFilters(v); setLimit(PAGE); }}
        onReset={() => { setFilters(DEFAULT_FILTERS); setLimit(PAGE); }}
        open={open}
        onToggle={() => setOpen(!open)}
      />

      <div className="grid gap-2">
        {pool.isLoading && Array.from({ length: 8 }).map((_, i) => <PlayerRowSkeleton key={i} />)}
        {visible.map((p) => <PlayerListRow key={p.id} player={p} />)}
      </div>

      {!pool.isLoading && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">لا توجد نتائج بالفلاتر الحالية.</p>
      )}

      {limit < results.length && (
        <button onClick={() => setLimit(limit + PAGE)}
          className="w-full mt-4 py-3 glass-strong rounded-xl text-sm font-bold hover:bg-primary/10 transition-fluid">
          عرض المزيد ({results.length - limit} متبقٍ)
        </button>
      )}
    </div>
  );
};

export default PlayersPage;
