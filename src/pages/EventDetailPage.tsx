import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Sparkles, ArrowUpDown } from "lucide-react";
import { usePlayersByPromo } from "@/hooks/useFutgg";
import { categoryLabel, displayName, type FutGgPlayer } from "@/services/futggApi";
import { futggToPlayer } from "@/services/fc26Api";
import { playerSlug } from "@/lib/slug";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerCardSkeleton } from "@/components/Skeleton";

const POSITIONS = ["ALL", "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST", "CF"];

const EventPlayer = ({ p }: { p: FutGgPlayer }) => {
  const img = p.cardImageUrl || p.simpleCardImageUrl || p.imageUrl;
  return (
    <Link
      to={`/player/${playerSlug(displayName(p), p.eaId)}`}
      state={{ player: futggToPlayer(p) }}
      className="glass hover:glass-strong rounded-2xl p-3 flex flex-col items-center gap-2 transition-fluid group"
    >
      <div className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden">
        {img ? (
          <img src={img} alt={displayName(p)} loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center text-xl font-bold">
            {(displayName(p) || "?").charAt(0)}
          </div>
        )}
        <span className="absolute top-1 left-1 rating-chip text-[10px]">{p.overall}</span>
      </div>
      <div className="w-full text-center">
        <p className="font-bold text-xs truncate">{displayName(p)}</p>
        <p className="text-[10px] text-primary font-semibold truncate">{categoryLabel(p)}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {p.position} · {p.club?.name || "—"}
        </p>
      </div>
    </Link>
  );
};

const EventDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pos, setPos] = useState<string>("ALL");
  const [sort, setSort] = useState<"overall" | "recent">("overall");
  const { group, isLoading, error } = usePlayersByPromo(slug, 8);

  const filtered = useMemo(() => {
    if (!group) return [];
    let list = pos === "ALL" ? group.players : group.players.filter((p) => p.position === pos);
    if (sort === "recent") {
      list = [...list].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    return list;
  }, [group, pos, sort]);

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Helmet>
        <title>{group ? `${group.name} — futmac.com FC 26` : "الحدث — futmac.com"}</title>
        <meta name="description" content={group ? `كل لاعبي ${group.name} في EA FC 26 (${group.count} لاعب).` : "تفاصيل الحدث في EA FC 26"} />
      </Helmet>

      <Breadcrumbs items={[{ label: "الأحداث", href: "/events" }, { label: group?.name ?? "..." }]} />

      {isLoading && (
        <div className="glass rounded-2xl p-6 mb-4 animate-pulse h-24" />
      )}

      {error && (
        <div className="glass rounded-xl p-6 text-center text-sm text-destructive">
          تعذّر تحميل الحدث.
        </div>
      )}

      {group && (
        <>
          <div className="bg-gradient-hero rounded-3xl p-5 mb-5 border border-border/60 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">FC 26 · حدث نشط</span>
            </div>
            <h1 className="text-2xl font-black mb-1">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {group.count} لاعب · أعلى تقييم {group.topOverall}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
              {POSITIONS.map((x) => (
                <button
                  key={x}
                  onClick={() => setPos(x)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-fluid ${
                    pos === x
                      ? "bg-gradient-primary text-primary-foreground"
                      : "glass text-muted-foreground"
                  }`}
                >
                  {x === "ALL" ? "الكل" : x}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSort((s) => (s === "overall" ? "recent" : "overall"))}
              className="ml-auto glass-strong px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sort === "overall" ? "التقييم" : "الأحدث"}
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
              لا يوجد لاعبون بهذا المركز.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((p) => <EventPlayer key={p.id} p={p} />)}
            </div>
          )}
        </>
      )}

      {!isLoading && !error && !group && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">الحدث غير موجود.</p>
          <Link to="/events" className="text-primary text-xs font-bold mt-2 inline-block">← عودة للأحداث</Link>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
