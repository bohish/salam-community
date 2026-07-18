import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, ExternalLink, GitCompare, ArrowLeft, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePlayerById, useTeamPlayers, useNationPlayers } from "@/hooks/useFc26";
import { buildStatGroups } from "@/types/player";
import type { Player } from "@/types/player";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import Breadcrumbs from "@/components/Breadcrumbs";
import PlayerListRow from "@/components/PlayerListRow";
import { parseIdFromSlug, playerSlug } from "@/lib/slug";
import { futggApi, displayName, categoryLabel, type FutGgPlayer } from "@/services/futggApi";

import FaceStats from "@/components/player/FaceStats";
import StatRadar from "@/components/player/StatRadar";
import PriceTrend from "@/components/player/PriceTrend";
import ChemistryStyles from "@/components/player/ChemistryStyles";
import ChemistryViz from "@/components/player/ChemistryViz";
import EvolutionHistory from "@/components/player/EvolutionHistory";
import InfoTable from "@/components/player/InfoTable";
import GameStats from "@/components/player/GameStats";
import PlayerDetailSkeleton from "@/components/player/PlayerDetailSkeleton";

/* ---------- shared primitives ---------- */

const Panel = ({
  title,
  children,
  className = "",
  aside,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}) => (
  <div className={`rounded-lg border border-border/60 bg-card/40 overflow-hidden ${className}`}>
    <div className="h-px bg-primary/40" />
    <div className="p-4">
      {(title || aside) && (
        <div className="flex items-baseline justify-between mb-3">
          {title && <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </div>
  </div>
);

const Stars = ({ n, max = 5 }: { n: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < n ? "fill-primary/80 text-primary/80" : "text-border"}`} />
    ))}
  </div>
);

const InfoLine = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between gap-2 py-2 text-[12px] border-b border-border/40 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground/95 truncate max-w-[60%] text-right">{value}</span>
  </div>
);

const VersionCard = ({ v }: { v: FutGgPlayer }) => (
  <a
    href={v.url ? (v.url.startsWith("http") ? v.url : `https://www.fut.gg${v.url}`) : `https://www.fut.gg/players/${v.slug}`}
    target="_blank"
    rel="noreferrer"
    className="shrink-0 w-32 rounded-lg border border-border/60 bg-card/40 p-3 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors text-center"
    title={displayName(v)}
  >
    <div className="w-20 h-28 flex items-center justify-center">
      {(v.simpleCardImageUrl || v.cardImageUrl) && (
        <img
          src={v.simpleCardImageUrl || v.cardImageUrl}
          alt={displayName(v)}
          loading="lazy"
          className="max-h-full object-contain"
        />
      )}
    </div>
    <div className="flex items-center gap-1.5">
      <span className="font-mono-num text-[13px] font-semibold tabular-nums text-foreground">{v.overall}</span>
      <span className="text-[10.5px] font-medium text-muted-foreground">{v.position}</span>
    </div>
    <p className="text-[10.5px] text-muted-foreground truncate w-full">{categoryLabel(v)}</p>
  </a>
);

/* ---------- page ---------- */

const PlayerDetailPage = () => {
  const { id: rawParam } = useParams();
  const location = useLocation();
  const numericId = parseIdFromSlug(rawParam || "");
  const routedPlayer = (location.state as { player?: Player } | null)?.player;
  const initialPlayer = routedPlayer && String(routedPlayer.id) === numericId ? routedPlayer : undefined;
  const { data: player, isLoading, error } = usePlayerById(numericId, initialPlayer);
  const { isFavorite, toggle } = useFavorites();
  const compare = useCompare();
  const navigate = useNavigate();

  const teammates = useTeamPlayers(player?.club);
  const countrymen = useNationPlayers(player?.nation);

  const surname = player?.name.split(" ").slice(-1)[0] ?? "";
  const versionsQ = useQuery({
    queryKey: ["futgg", "versions", player?.id, surname],
    queryFn: async ({ signal }) => {
      if (!player) return [];
      const r = await futggApi.search(surname, signal).catch(() => null);
      if (!r?.data) return [];
      return r.data.filter((v) => v.eaId === player.id).sort((a, b) => b.overall - a.overall);
    },
    enabled: !!player && surname.length >= 2,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) return <PlayerDetailSkeleton />;

  if (error || !player)
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-2">تعذّر تحميل بيانات اللاعب.</p>
        <Link to="/" className="text-primary text-sm">
          العودة للرئيسية
        </Link>
      </div>
    );

  const groups = buildStatGroups(player);
  const fav = isFavorite(player.id);
  const inCompare = compare.has(player.id);
  const canonical = `/player/${playerSlug(player.name, player.id)}`;

  const psPlus = player.playStyles.filter((s) => s.endsWith("+"));
  const psBase = player.playStyles.filter((s) => !s.endsWith("+"));

  const near = (list: typeof teammates.data) =>
    (list ?? [])
      .filter((p) => p.id !== player.id)
      .sort((a, b) => Math.abs(a.rating - player.rating) - Math.abs(b.rating - player.rating))
      .slice(0, 5);

  const sameClub = near(teammates.data);
  const sameNation = near(countrymen.data);
  const cheaper = (teammates.data ?? [])
    .filter((p) => p.id !== player.id && p.rating < player.rating && p.position === player.position)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  const better = (teammates.data ?? [])
    .filter((p) => p.id !== player.id && p.rating > player.rating && p.position === player.position)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 5);

  const openCompare = () => {
    if (!compare.has(player.id)) compare.toggle(player.id);
    navigate("/compare");
  };

  const foot = (player.raw["Preferred Foot"] as string) || (player.raw["foot"] as string) || player.preferredFoot || "—";
  const height = (player.raw["Height"] || player.raw["height"] || player.height) as string | number | undefined;
  const weight = (player.raw["Weight"] || player.raw["weight"] || player.weight) as string | number | undefined;
  const wf = Number(player.raw["Weak Foot"] || player.raw["weakFoot"] || player.weakFoot || 3);
  const skm = Number(player.raw["Skill Moves"] || player.raw["skillMoves"] || player.skillMoves || 3);
  const wrAtk = String(player.raw["Att. Work Rate"] || player.raw["attackWorkRate"] || "Med");
  const wrDef = String(player.raw["Def. Work Rate"] || player.raw["defenseWorkRate"] || "Med");

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${player.name} · ${player.rating} ${player.position} — futmac.com FC 26`}</title>
        <meta
          name="description"
          content={`إحصائيات ${player.name} في EA SPORTS FC 26 — تقييم ${player.rating}, ${player.club} · ${player.nation}.`}
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${player.name} — ${player.rating} ${player.position}`} />
        <meta property="og:description" content={`${player.club} · ${player.nation} · إحصائيات EA FC 26 كاملة.`} />
        {player.cardUrl && <meta property="og:image" content={player.cardUrl} />}
      </Helmet>

      <div className="container mx-auto px-4 pt-4 pb-12 max-w-[1200px]">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <Breadcrumbs items={[{ label: "اللاعبون", href: "/players" }, { label: player.name }]} />
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> رجوع
          </button>
        </div>

        {/* Identity header */}
        <header className="rounded-lg border border-border/60 bg-card/40 overflow-hidden mb-5">
          <div className="h-px bg-primary/40" />
          <div className="p-5 md:p-6 grid md:grid-cols-[220px_1fr] gap-6">
            {/* Card */}
            <div className="flex md:block justify-center">
              {player.cardUrl && (
                <img
                  src={player.cardUrl}
                  alt={player.name}
                  className="w-40 md:w-full max-w-[220px] object-contain"
                />
              )}
            </div>

            {/* Identity */}
            <div className="flex flex-col justify-between gap-5">
              <div>
                <p className="text-[10.5px] tracking-[0.24em] uppercase text-muted-foreground">EA Sports FC 26</p>
                <h1 className="font-display text-3xl md:text-[38px] font-semibold tracking-tight mt-1 leading-tight text-foreground">
                  {player.name}
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1.5">
                  {player.club} · {player.league} · {player.nation}
                </p>
              </div>

              {/* Key numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-l-2 border-primary/60 pl-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Overall</p>
                  <p className="font-mono-num text-[22px] font-semibold text-foreground mt-0.5">{player.rating}</p>
                </div>
                <div className="border-l border-border/60 pl-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Position</p>
                  <p className="font-mono-num text-[22px] font-semibold text-foreground mt-0.5">{player.position}</p>
                </div>
                <div className="border-l border-border/60 pl-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Skills</p>
                  <div className="mt-1.5"><Stars n={skm} /></div>
                </div>
                <div className="border-l border-border/60 pl-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Weak Foot</p>
                  <div className="mt-1.5"><Stars n={wf} /></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={openCompare}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/40 text-primary px-3 py-1.5 text-[12px] font-medium hover:bg-primary/15 transition-colors"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  {inCompare ? "افتح المقارنة" : "قارن اللاعب"}
                </button>
                <button
                  onClick={() => compare.toggle(player.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  {inCompare ? "في القائمة" : "أضف للمقارنة"}
                </button>
                <button
                  onClick={() => toggle(player)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                  <Heart className={`w-3.5 h-3.5 ${fav ? "fill-primary text-primary" : ""}`} />
                  {fav ? "مفضّل" : "المفضلة"}
                </button>
                {player.eaUrl && (
                  <a
                    href={player.eaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    EA Sports <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* PlayStyles + Info side-by-side */}
        <section className="grid lg:grid-cols-[1fr_320px] gap-4 mb-5">
          <Panel title="PlayStyles">
            {player.playStyles.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">لا توجد PlayStyles.</p>
            ) : (
              <div className="space-y-3">
                {psPlus.length > 0 && (
                  <div>
                    <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Plus</p>
                    <div className="flex flex-wrap gap-1.5">
                      {psPlus.map((ps) => (
                        <span
                          key={ps}
                          className="px-2 py-1 rounded text-[11px] font-medium bg-primary/12 border border-primary/40 text-primary"
                        >
                          {ps}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {psBase.length > 0 && (
                  <div>
                    <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Base</p>
                    <div className="flex flex-wrap gap-1.5">
                      {psBase.map((ps) => (
                        <span
                          key={ps}
                          className="px-2 py-1 rounded text-[11px] font-medium border border-border/60 text-foreground/85"
                        >
                          {ps}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Player Info">
            <InfoLine label="النادي" value={player.club || "—"} />
            <InfoLine label="الدوري" value={player.league || "—"} />
            <InfoLine label="المنتخب" value={player.nation || "—"} />
            {height && <InfoLine label="الطول" value={height as string} />}
            {weight && <InfoLine label="الوزن" value={weight as string} />}
            <InfoLine label="القدم" value={foot} />
            <InfoLine label="معدل الهجوم" value={wrAtk} />
            <InfoLine label="معدل الدفاع" value={wrDef} />
          </Panel>
        </section>

        {/* Attributes */}
        <section className="mb-5">
          <FaceStats player={player} groups={groups} />
        </section>

        {/* Radar + Chemistry + Price */}
        <section className="grid lg:grid-cols-3 gap-4 mb-5">
          <Panel title="Attribute Radar">
            <StatRadar player={player} />
          </Panel>
          <ChemistryViz player={player} />
          <PriceTrend id={player.id} rating={player.rating} />
        </section>

        {/* Chemistry styles + evolution */}
        <section className="grid lg:grid-cols-2 gap-4 mb-5">
          {!player.isGK && <ChemistryStyles player={player} />}
          <EvolutionHistory player={player} />
        </section>

        {/* Full info + game stats */}
        <section className="grid lg:grid-cols-2 gap-4 mb-6">
          <InfoTable player={player} />
          <GameStats player={player} />
        </section>

        {/* Other versions */}
        {versionsQ.data && versionsQ.data.length > 1 && (
          <section className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Other Versions</h2>
              <span className="text-[10.5px] text-muted-foreground">{versionsQ.data.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {versionsQ.data.map((v) => (
                <VersionCard key={v.id} v={v} />
              ))}
            </div>
          </section>
        )}

        {/* Similar players */}
        {(sameClub.length > 0 || sameNation.length > 0 || better.length > 0 || cheaper.length > 0) && (
          <section className="mb-10">
            <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3">
              Similar Players
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {sameClub.length > 0 && (
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">من نفس النادي</p>
                  <div className="grid gap-2">{sameClub.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                </div>
              )}
              {sameNation.length > 0 && (
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">من نفس المنتخب</p>
                  <div className="grid gap-2">{sameNation.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                </div>
              )}
              {better.length > 0 && (
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                    بدائل أفضل ({player.position})
                  </p>
                  <div className="grid gap-2">{better.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                </div>
              )}
              {cheaper.length > 0 && (
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                    بدائل أرخص ({player.position})
                  </p>
                  <div className="grid gap-2">{cheaper.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PlayerDetailPage;
