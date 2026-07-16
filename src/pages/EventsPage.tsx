import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Sparkles, Filter, ChevronLeft } from "lucide-react";
import { useUpgradeHub, useLatestPlayers, useAllPromos } from "@/hooks/useFutgg";
import { categoryLabel, displayName, type FutGgPlayer, type PromoGroup } from "@/services/futggApi";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerCardSkeleton } from "@/components/Skeleton";

type Tab = "promos" | "new" | "special" | "icon" | "hero" | "evo" | "sbc" | "obj";

const TABS: { id: Tab; label: string }[] = [
  { id: "promos", label: "البروموات" },
  { id: "new", label: "الجديد" },
  { id: "special", label: "خاصة" },
  { id: "icon", label: "Icons" },
  { id: "hero", label: "Heroes" },
  { id: "evo", label: "Evolutions" },
  { id: "sbc", label: "SBC" },
  { id: "obj", label: "Objectives" },
];

const matches = (p: FutGgPlayer, tab: Tab): boolean => {
  switch (tab) {
    case "promos":
    case "new": return true;
    case "special": return p.isSpecial && !p.isIcon && !p.isHero;
    case "icon": return p.isIcon;
    case "hero": return p.isHero;
    case "evo": return !!p.isEvolutionPlayerItem;
    case "sbc": return p.isSbc;
    case "obj": return p.isObjective;
  }
};

const EventCard = ({ p }: { p: FutGgPlayer }) => {
  const img = p.cardImageUrl || p.simpleCardImageUrl || p.socialImageUrl || p.imageUrl;
  const label = categoryLabel(p);
  return (
    <Link
      to={`/player/${p.eaId}`}
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
        <p className="text-[10px] text-primary font-semibold truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {p.position} · {p.club?.name || "—"}
        </p>
      </div>
    </Link>
  );
};

const PromoCard = ({ g }: { g: PromoGroup }) => (
  <Link
    to={`/event/${g.slug}`}
    className="glass hover:glass-strong rounded-2xl p-4 transition-fluid group flex flex-col gap-3"
  >
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="font-black text-sm truncate">{g.name}</p>
        <p className="text-[10px] text-muted-foreground">{g.count} لاعب · أعلى {g.topOverall}</p>
      </div>
      <ChevronLeft className="w-4 h-4 text-primary shrink-0 group-hover:-translate-x-0.5 transition-transform" />
    </div>
    <div className="flex gap-1.5 items-end">
      {g.preview.map((p) => {
        const img = p.cardImageUrl || p.simpleCardImageUrl || p.imageUrl;
        return (
          <div key={p.id} className="flex-1 aspect-[3/4] rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
            {img && <img src={img} alt={displayName(p)} loading="lazy" className="w-full h-full object-contain" />}
          </div>
        );
      })}
    </div>
  </Link>
);

const EventsPage = () => {
  const [tab, setTab] = useState<Tab>("promos");
  const [page, setPage] = useState(1);

  const promosQ = useAllPromos(8);
  const hub = useUpgradeHub(tab === "new" ? page : 1);
  const all = useLatestPlayers(tab !== "new" && tab !== "promos" ? page : 1);
  const source = tab === "new" ? hub : all;

  const players =
    tab === "promos" ? [] : (source.data?.data ?? []).filter((p) => matches(p, tab));
  const totalPages = source.data?.totalPages ?? 1;

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Helmet>
        <title>الأحداث والكروت الجديدة — FUTHUB FC 26</title>
        <meta name="description" content="كل بروموات EA FC 26: TOTW, TOTY, TOTS, Icons, Heroes, SBC, Objectives و Evolutions." />
      </Helmet>

      <Breadcrumbs items={[{ label: "الأحداث والكروت" }]} />

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h1 className="text-2xl font-black">الأحداث والكروت</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        كل الإصدارات الحية في EA FC 26 · مصدر: FUT.GG
      </p>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-fluid ${
              tab === t.id
                ? "bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Promos tab */}
      {tab === "promos" && (
        <>
          {promosQ.isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-4 h-48 animate-pulse" />
              ))}
            </div>
          )}
          {promosQ.error && (
            <div className="glass rounded-xl p-6 text-center text-sm text-destructive">
              تعذّر تحميل البروموات من FUT.GG.
            </div>
          )}
          {promosQ.promos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {promosQ.promos.map((g) => <PromoCard key={g.slug} g={g} />)}
            </div>
          )}
        </>
      )}

      {/* Other tabs (paginated) */}
      {tab !== "promos" && (
        <>
          {source.isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
            </div>
          )}

          {source.error && (
            <div className="glass rounded-xl p-6 text-center text-sm text-destructive">
              تعذّر تحميل البيانات من FUT.GG. حاول لاحقاً.
            </div>
          )}

          {source.data && (
            <>
              {players.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد نتائج في هذه الصفحة لهذا التصنيف.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {players.map((p) => <EventCard key={p.id} p={p} />)}
                </div>
              )}

              <div className="flex items-center justify-between mt-6 gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="glass-strong px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  السابق
                </button>
                <span className="text-xs text-muted-foreground">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="glass-strong px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;
