import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { X, Plus, Trophy } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { fc26Api } from "@/services/fc26Api";
import { useCompare } from "@/hooks/useCompare";
import { buildStatGroups, type Player } from "@/types/player";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerCardSkeleton } from "@/components/Skeleton";
import { playerSlug } from "@/lib/slug";

const StatRow = ({ label, values }: { label: string; values: (number | undefined)[] }) => {
  const max = Math.max(...values.map((v) => v ?? 0), 1);
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-[11px] text-muted-foreground truncate">{label}</span>
      <div className={`grid grid-cols-${values.length} gap-1.5`} style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((v, i) => (
          <span key={i} className={`text-center text-sm font-bold ${v === max && v ? "text-primary" : "text-foreground/80"}`}>
            {v ?? "—"}
          </span>
        ))}
      </div>
    </div>
  );
};

const ComparePage = () => {
  const { ids, remove, clear } = useCompare();

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["fc26", "player", "id", id],
      queryFn: ({ signal }: { signal?: AbortSignal }) => fc26Api.getById(id, signal),
      staleTime: 60 * 60 * 1000,
    })),
  });

  const players: Player[] = queries.map((q) => q.data).filter((p): p is Player => !!p);
  const loading = queries.some((q) => q.isLoading);

  if (ids.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Helmet><title>مقارنة اللاعبين — FUTHUB FC 26</title></Helmet>
        <Breadcrumbs items={[{ label: "مقارنة اللاعبين" }]} />
        <div className="glass-strong rounded-3xl p-12 text-center animate-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-black text-xl mb-2">مقارنة اللاعبين</h2>
          <p className="text-sm text-muted-foreground mb-6">أضف حتى 4 لاعبين للمقارنة. اضغط زر ⇄ على أي بطاقة لاعب.</p>
          <Link to="/players" className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-lg glow-hover">
            <Plus className="w-4 h-4" /> تصفح اللاعبين
          </Link>
        </div>
      </div>
    );
  }

  const groups = players[0] ? buildStatGroups(players[0]) : [];

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <Helmet>
        <title>مقارنة {players.map((p) => p.name).join(" vs ")} — FUTHUB FC 26</title>
        <meta name="description" content={`مقارنة تفصيلية للإحصائيات بين ${players.map((p) => p.name).join(" و ")}.`} />
      </Helmet>

      <Breadcrumbs items={[{ label: "مقارنة اللاعبين" }]} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black">المقارنة ({players.length})</h1>
        <button onClick={clear} className="text-xs text-destructive glass px-3 py-1.5 rounded-lg">تفريغ الكل</button>
      </div>

      {/* Cards row */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${ids.length}, minmax(0, 1fr))` }}>
        {ids.map((id, i) => {
          const p = queries[i].data;
          if (queries[i].isLoading) return <PlayerCardSkeleton key={id} />;
          if (!p) return (
            <div key={id} className="glass rounded-2xl p-3 text-center text-xs text-destructive">
              تعذّر تحميل ID {id}
              <button onClick={() => remove(id)} className="block mx-auto mt-2 text-muted-foreground">إزالة</button>
            </div>
          );
          return (
            <div key={id} className="card-premium rounded-2xl p-3 relative">
              <button onClick={() => remove(id)} className="absolute top-2 left-2 w-6 h-6 rounded-full glass flex items-center justify-center hover:bg-destructive/20">
                <X className="w-3 h-3" />
              </button>
              <div className="w-full aspect-[3/4] flex items-center justify-center">
                {p.cardUrl && <img src={p.cardUrl} alt={p.name} loading="lazy" className="max-h-full object-contain drop-shadow-2xl" />}
              </div>
              <Link to={`/player/${playerSlug(p.name, p.id)}`} className="block mt-2 text-center">
                <p className="font-black text-sm truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{p.club}</p>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Main 6 stats */}
      {players.length > 0 && (
        <div className="glass-strong rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-black mb-2">الإحصائيات الرئيسية</h3>
          {(players[0].isGK
            ? ["DIV", "HAN", "KIC", "REF", "SPD", "POS"] as const
            : ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"] as const
          ).map((k) => {
            const getter = (p: Player): number => {
              if (players[0].isGK) {
                switch (k) {
                  case "DIV": return parseInt(p.raw["GK Diving"] || "0");
                  case "HAN": return parseInt(p.raw["GK Handling"] || "0");
                  case "KIC": return parseInt(p.raw["GK Kicking"] || "0");
                  case "REF": return parseInt(p.raw["GK Reflexes"] || "0");
                  case "POS": return parseInt(p.raw["GK Positioning"] || "0");
                  case "SPD": return p.pace;
                }
              }
              return (p as any)[
                { PAC: "pace", SHO: "shooting", PAS: "passing", DRI: "dribbling", DEF: "defending", PHY: "physical" }[k as string]!
              ] as number;
            };
            return <StatRow key={k} label={k} values={players.map(getter)} />;
          })}
        </div>
      )}

      {/* Detailed stats */}
      {!loading && groups.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.title} className="glass rounded-2xl p-4">
              <h3 className="text-sm font-black mb-2">{g.title}</h3>
              {g.stats.map((s) => (
                <StatRow
                  key={s.key}
                  label={s.label}
                  values={players.map((p) => {
                    const v = (p.raw as any)[s.key];
                    const n = parseInt(String(v ?? "0"));
                    return Number.isFinite(n) ? n : 0;
                  })}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-4 mt-4 grid gap-2">
        <h3 className="text-sm font-black mb-1">المعلومات</h3>
        <StatRow label="العمر" values={players.map((p) => p.age)} />
        <StatRow label="القدم الضعيفة" values={players.map((p) => p.weakFoot)} />
        <StatRow label="المهارات" values={players.map((p) => p.skillMoves)} />
      </div>
    </div>
  );
};

export default ComparePage;
