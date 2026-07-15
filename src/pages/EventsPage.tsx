import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Sparkles, Filter } from "lucide-react";
import { useUpgradeHub, useLatestPlayers } from "@/hooks/useFutgg";
import { categoryLabel, displayName, type FutGgPlayer } from "@/services/futggApi";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerCardSkeleton } from "@/components/Skeleton";

type Tab = "new" | "special" | "icon" | "hero" | "evo" | "sbc" | "obj";

const TABS: { id: Tab; label: string }[] = [
  { id: "new", label: "الجديد" },
  { id: "special", label: "بروموات" },
  { id: "icon", label: "Icons" },
  { id: "hero", label: "Heroes" },
  { id: "evo", label: "Evolutions" },
  { id: "sbc", label: "SBC" },
  { id: "obj", label: "Objectives" },
];

const matches = (p: FutGgPlayer, tab: Tab): boolean => {
  switch (tab) {
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
    <a
      href={p.url ? `https://www.fut.gg${p.url}` : "#"}
      target="_blank"
      rel="noopener noreferrer"
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
    </a>
  );
};

const EventsPage = () => {
  const [tab, setTab] = useState<Tab>("new");
  const [page, setPage] = useState(1);
  const isNew = tab === "new";
  const hub = useUpgradeHub(isNew ? page : 1);
  const all = useLatestPlayers(isNew ? 1 : page);
  const source = isNew ? hub : all;

  const players = (source.data?.data ?? []).filter((p) => matches(p, tab));
  const totalPages = source.data?.totalPages ?? 1;

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Helmet>
        <title>الأحداث والكروت الجديدة — FUTHUB FC 26</title>
        <meta name="description" content="أحدث كروت EA FC 26: TOTW, TOTY, Icons, Heroes, SBC, Objectives و Evolutions." />
      </Helmet>

      <Breadcrumbs items={[{ label: "الأحداث والكروت" }]} />

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h1 className="text-2xl font-black">الأحداث والكروت</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        كل الإصدارات الخاصة الحية في EA FC 26 · مصدر: FUT.GG
      </p>

      {/* Tabs */}
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
              <p className="text-xs text-muted-foreground mt-1">جرّب صفحة أخرى أو تبويباً مختلفاً.</p>
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
    </div>
  );
};

export default EventsPage;
