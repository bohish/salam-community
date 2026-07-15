import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useTeamPlayers, useNationPlayers } from "@/hooks/useFc26";
import PlayerListRow from "@/components/PlayerListRow";
import { CLUBS_BY_LEAGUE } from "@/data/catalog";

type Mode = "club" | "nation" | "league";

const EntityPlayersPage = ({ mode }: { mode: Mode }) => {
  const { name = "" } = useParams();
  const [sort, setSort] = useState<"rating" | "name">("rating");
  const decoded = decodeURIComponent(name);

  const team = useTeamPlayers(mode === "club" ? decoded : undefined);
  const nation = useNationPlayers(mode === "nation" ? decoded : undefined);

  // League: fetch each curated club and merge
  const leagueClubs = mode === "league" ? (CLUBS_BY_LEAGUE[decoded] ?? []) : [];
  const leagueQueries = leagueClubs.map((c) => useTeamPlayers(mode === "league" ? c : undefined));

  const players = useMemo(() => {
    let list = mode === "club" ? team.data ?? []
      : mode === "nation" ? nation.data ?? []
      : leagueQueries.flatMap((q) => q.data ?? []);
    // Dedupe
    const seen = new Set<number>();
    list = list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.data, nation.data, sort, mode, ...leagueQueries.map((q) => q.data)]);

  const isLoading = mode === "club" ? team.isLoading
    : mode === "nation" ? nation.isLoading
    : leagueQueries.some((q) => q.isLoading);

  const title = mode === "club" ? decoded : mode === "nation" ? decoded : decoded;
  const parentPath = mode === "club" ? "/clubs" : mode === "nation" ? "/nations" : "/leagues";
  const parentLabel = mode === "club" ? "الأندية" : mode === "nation" ? "المنتخبات" : "الدوريات";

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl">
      <Helmet>
        <title>{title} — FUTHUB FC 26</title>
        <meta name="description" content={`جميع لاعبي ${title} في EA SPORTS FC 26 مع الإحصائيات.`} />
      </Helmet>

      <Link to={parentPath} className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
        <ArrowRight className="w-4 h-4" /> {parentLabel}
      </Link>

      <div className="card-premium rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{parentLabel.slice(0, -1)}</p>
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{isLoading ? "جاري التحميل..." : `${players.length} لاعب`}</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="glass rounded-lg px-3 py-2 text-xs bg-transparent"
        >
          <option value="rating">الأعلى تقييماً</option>
          <option value="name">حسب الاسم</option>
        </select>
      </div>

      {isLoading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer mb-2" />)}

      <div className="grid gap-2">
        {players.map((p) => <PlayerListRow key={p.id} player={p} />)}
      </div>

      {!isLoading && players.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">لا توجد بيانات متاحة.</p>
      )}
    </div>
  );
};

export default EntityPlayersPage;
