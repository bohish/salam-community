import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMemo, useEffect, useState } from "react";
import { usePlayerByName, usePlayerPool } from "@/hooks/useFc26";
import PlayerListRow from "@/components/PlayerListRow";
import SearchSuggestions from "@/components/SearchSuggestions";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerRowSkeleton } from "@/components/Skeleton";

const SearchPage = () => {
  const [params] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  const pool = usePlayerPool(150);
  const trimmed = q.trim();
  const isNumeric = /^\d+$/.test(trimmed);
  const remote = usePlayerByName(!isNumeric && trimmed.length >= 3 ? trimmed : "");

  const results = useMemo(() => {
    const list = pool.data ?? [];
    if (!trimmed) return list;
    const s = trimmed.toLowerCase();
    const local = list.filter(
      (p) => p.name.toLowerCase().includes(s) || p.club.toLowerCase().includes(s) || p.nation.toLowerCase().includes(s)
    );
    if (remote.data && !local.find((p) => p.id === remote.data!.id)) return [remote.data, ...local];
    return local;
  }, [pool.data, remote.data, trimmed]);

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl">
      <Helmet>
        <title>{trimmed ? `بحث "${trimmed}"` : "البحث"} — FUTMAC FC 26</title>
        <meta name="description" content="ابحث عن أي لاعب في EA SPORTS FC 26 بالاسم أو رقم ID مع اقتراحات فورية." />
      </Helmet>

      <Breadcrumbs items={[{ label: "البحث" }]} />

      <div className="sticky top-2 z-30 mb-4">
        <SearchSuggestions variant="hero" autoFocus />
      </div>

      {trimmed && (
        <p className="text-xs text-muted-foreground mb-2 px-1">
          {results.length} نتيجة {trimmed && `لـ "${trimmed}"`}
        </p>
      )}

      <div className="grid gap-2">
        {pool.isLoading && Array.from({ length: 10 }).map((_, i) => <PlayerRowSkeleton key={i} />)}
        {results.slice(0, 60).map((p) => <PlayerListRow key={p.id} player={p} />)}
      </div>

      {!pool.isLoading && trimmed && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground mb-2">لا توجد نتائج لـ "{trimmed}".</p>
          <Link to="/players" className="text-primary text-xs">جرّب الفلاتر المتقدمة →</Link>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
