import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQueries } from "@tanstack/react-query";
import { fc26Api } from "@/services/fc26Api";
import { useTeamPlayers, useNationPlayers } from "@/hooks/useFc26";
import PlayerListRow from "@/components/PlayerListRow";
import AdvancedFilters, { DEFAULT_FILTERS, applyFilters, type FiltersState } from "@/components/AdvancedFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerRowSkeleton } from "@/components/Skeleton";
import { CLUBS_BY_LEAGUE, TOP_CLUBS, TOP_LEAGUES, TOP_NATIONS } from "@/data/catalog";
import type { Player } from "@/types/player";

type Mode = "club" | "nation" | "league";

const decodeFromSlug = (mode: Mode, slug: string): string => {
  const list = mode === "club" ? TOP_CLUBS : mode === "league" ? TOP_LEAGUES : TOP_NATIONS;
  const cleaned = decodeURIComponent(slug).toLowerCase();
  // Match against catalog by slugified name, else fall back to decoded.
  const found = list.find((c) => c.name.toLowerCase() === cleaned
    || c.name.toLowerCase().replace(/\s+/g, "-") === cleaned);
  return found ? found.name : decodeURIComponent(slug);
};

const EntityPlayersPage = ({ mode }: { mode: Mode }) => {
  const { name = "" } = useParams();
  const decoded = decodeFromSlug(mode, name);

  const team = useTeamPlayers(mode === "club" ? decoded : undefined);
  const nation = useNationPlayers(mode === "nation" ? decoded : undefined);

  const leagueClubs = mode === "league" ? (CLUBS_BY_LEAGUE[decoded] ?? []) : [];
  const leagueQueries = useQueries({
    queries: leagueClubs.map((c) => ({
      queryKey: ["fc26", "team", c],
      queryFn: ({ signal }: { signal?: AbortSignal }) => fc26Api.getByTeam(c, signal),
      staleTime: 60 * 60 * 1000,
    })),
  });

  const basePlayers = useMemo(() => {
    let list: Player[] = mode === "club" ? team.data ?? []
      : mode === "nation" ? nation.data ?? []
      : leagueQueries.flatMap((q) => q.data ?? []);
    const seen = new Set<number>();
    return list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.data, nation.data, mode, ...leagueQueries.map((q) => q.data)]);

  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [open, setOpen] = useState(false);

  const results = useMemo(() => applyFilters(basePlayers, filters), [basePlayers, filters]);

  const isLoading = mode === "club" ? team.isLoading
    : mode === "nation" ? nation.isLoading
    : leagueQueries.some((q) => q.isLoading);

  const parentPath = mode === "club" ? "/clubs" : mode === "nation" ? "/nations" : "/leagues";
  const parentLabel = mode === "club" ? "الأندية" : mode === "nation" ? "المنتخبات" : "الدوريات";

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl">
      <Helmet>
        <title>{decoded} — FUTHUB FC 26</title>
        <meta name="description" content={`جميع لاعبي ${decoded} في EA SPORTS FC 26 مع الإحصائيات والفلاتر.`} />
        <link rel="canonical" href={`${parentPath.replace("s", "")}/${encodeURIComponent(name)}`} />
      </Helmet>

      <Breadcrumbs items={[
        { label: parentLabel, href: parentPath },
        { label: decoded },
      ]} />

      <div className="card-premium rounded-2xl p-4 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{parentLabel.slice(0, -2)}</p>
        <h1 className="text-2xl font-black">{decoded}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {isLoading ? "جاري التحميل..." : `${results.length} من ${basePlayers.length} لاعب`}
        </p>
      </div>

      <AdvancedFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        open={open}
        onToggle={() => setOpen(!open)}
      />

      <div className="grid gap-2">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <PlayerRowSkeleton key={i} />)}
        {results.map((p) => <PlayerListRow key={p.id} player={p} />)}
      </div>

      {!isLoading && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          {basePlayers.length === 0 ? "لا توجد بيانات متاحة." : "لا توجد نتائج بالفلاتر الحالية."}
        </p>
      )}

      <Link to={parentPath} className="text-sm text-primary block text-center mt-6">← {parentLabel}</Link>
    </div>
  );
};

export default EntityPlayersPage;
