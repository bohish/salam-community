import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowUpDown, Sparkles } from "lucide-react";
import { useNewPlayers } from "@/hooks/useFutgg";
import { categoryLabel, displayName, type FutGgPlayer } from "@/services/futggApi";
import { futggToPlayer } from "@/services/fc26Api";
import { playerSlug } from "@/lib/slug";
import Breadcrumbs from "@/components/Breadcrumbs";
import RefreshButton from "@/components/RefreshButton";
import { PlayerCardSkeleton } from "@/components/Skeleton";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const isRecentlyAdded = (createdAt?: string): boolean => {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && Date.now() - t <= SEVEN_DAYS;
};

type FilterKey = "all" | "gold" | "special" | "icons" | "heroes" | "women";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "gold", label: "ذهبية" },
  { key: "special", label: "خاصة" },
  { key: "icons", label: "أساطير" },
  { key: "heroes", label: "أبطال" },
  { key: "women", label: "لاعبات" },
];

const matchesFilter = (p: FutGgPlayer, f: FilterKey): boolean => {
  switch (f) {
    case "all": return true;
    case "gold": return !p.isSpecial && !p.isIcon && !p.isHero;
    case "special": return !!p.isSpecial && !p.isIcon && !p.isHero;
    case "icons": return !!p.isIcon;
    case "heroes": return !!p.isHero;
    case "women": {
      const r = (p.rarityName || "") + " " + (p.rarityGroupName || "");
      return /women|female|wsl|wcl/i.test(r);
    }
  }
};

export const NewPlayerCard = ({ p }: { p: FutGgPlayer }) => {
  const img = p.cardImageUrl || p.simpleCardImageUrl || p.imageUrl;
  const fresh = isRecentlyAdded(p.createdAt);
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
        {fresh && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider bg-primary text-primary-foreground shadow-lg animate-pulse">
            NEW
          </span>
        )}
      </div>
      <div className="w-full text-center">
        <p className="font-bold text-xs truncate">{displayName(p)}</p>
        <p className="text-[10px] text-primary font-semibold truncate">{categoryLabel(p)}</p>
        <p className="text-[10px] text-muted-foreground truncate">{p.position} · {p.club?.name || "—"}</p>
      </div>
    </Link>
  );
};

const NewPlayersPage = () => {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<"newest" | "rating">("newest");
  const { data, isLoading, error } = useNewPlayers(6);

  const list = useMemo(() => {
    const src = (data ?? []).filter((p) => matchesFilter(p, filter));
    return sort === "rating"
      ? [...src].sort((a, b) => b.overall - a.overall)
      : src;
  }, [data, filter, sort]);

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Helmet>
        <title>اللاعبون الجدد — futmac.com FC 26</title>
        <meta name="description" content="أحدث كروت اللاعبين المضافة في EA SPORTS FC 26 — فلاتر للذهبية والخاصة والأساطير والأبطال واللاعبات." />
        <link rel="canonical" href="/new" />
      </Helmet>

      <Breadcrumbs items={[{ label: "اللاعبون الجدد" }]} />

      <div className="bg-gradient-hero rounded-3xl p-5 mb-5 border border-border/60 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">FC 26 · مضاف حديثاً</span>
          </div>
          <RefreshButton />
        </div>
        <h1 className="text-2xl font-black mb-1">اللاعبون الجدد</h1>
        <p className="text-sm text-muted-foreground">
          أحدث الكروت المضافة إلى القاعدة — يتحدث تلقائياً مع كل استيراد جديد.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-fluid ${
                filter === f.key ? "bg-gradient-primary text-primary-foreground" : "glass text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSort((s) => (s === "newest" ? "rating" : "newest"))}
          className="ml-auto glass-strong px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sort === "newest" ? "الأحدث" : "الأعلى تقييماً"}
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      )}

      {error && (
        <div className="glass rounded-xl p-6 text-center text-sm text-destructive">
          تعذّر تحميل اللاعبين الجدد.
        </div>
      )}

      {!isLoading && !error && list.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          لا يوجد لاعبون مطابقون لهذا الفلتر.
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {list.map((p) => <NewPlayerCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
};

export default NewPlayersPage;
