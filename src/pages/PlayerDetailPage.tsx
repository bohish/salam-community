import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, ExternalLink, GitCompare, Layers, ArrowLeft, Sparkles, Ruler, Weight, Footprints, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePlayerById, useTeamPlayers, useNationPlayers } from "@/hooks/useFc26";
import { buildStatGroups } from "@/types/player";
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

const VersionCard = ({ v }: { v: FutGgPlayer }) => (
  <a
    href={v.url ? (v.url.startsWith("http") ? v.url : `https://www.fut.gg${v.url}`) : `https://www.fut.gg/players/${v.slug}`}
    target="_blank" rel="noreferrer"
    className="glass rounded-xl p-3 flex flex-col items-center gap-2 hover:glass-strong hover:border-primary/40 transition-fluid text-center shrink-0 w-32"
    title={displayName(v)}
  >
    <div className="w-20 h-28 flex items-center justify-center">
      {(v.simpleCardImageUrl || v.cardImageUrl) && (
        <img src={v.simpleCardImageUrl || v.cardImageUrl} alt={displayName(v)} loading="lazy" className="max-h-full object-contain drop-shadow-xl" />
      )}
    </div>
    <div className="flex items-center gap-1.5">
      <span className={`rating-chip ${v.overall >= 87 ? "rating-chip-elite" : ""}`}>{v.overall}</span>
      <span className="text-[10px] font-bold text-muted-foreground">{v.position}</span>
    </div>
    <p className="text-[10px] font-bold text-primary/90 truncate w-full">{categoryLabel(v)}</p>
  </a>
);

const StarRow = ({ n, max = 5, label }: { n: number; max?: number; label: string }) => (
  <div className="flex items-center justify-between gap-2 py-1.5">
    <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">{label}</span>
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < n ? "fill-accent text-accent" : "text-white/10"}`} />
      ))}
    </div>
  </div>
);

const InfoLine = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) => (
  <div className="flex items-center justify-between gap-2 py-1.5 text-[12px]">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </span>
    <span className="font-bold text-foreground/95 truncate">{value}</span>
  </div>
);

const PlayerDetailPage = () => {
  const { id: rawParam } = useParams();
  const numericId = parseIdFromSlug(rawParam || "");
  const { data: player, isLoading, error } = usePlayerById(numericId);
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

  if (error || !player) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-destructive mb-2">تعذّر تحميل بيانات اللاعب.</p>
      <Link to="/" className="text-primary text-sm">العودة للرئيسية</Link>
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
    .sort((a, b) => b.rating - a.rating).slice(0, 5);
  const better = (teammates.data ?? [])
    .filter((p) => p.id !== player.id && p.rating > player.rating && p.position === player.position)
    .sort((a, b) => a.rating - b.rating).slice(0, 5);

  const openCompare = () => {
    if (!compare.has(player.id)) compare.toggle(player.id);
    navigate("/compare");
  };

  const foot = (player.raw["Preferred Foot"] as string) || (player.raw["foot"] as string) || "—";
  const height = player.raw["Height"] || player.raw["height"];
  const weight = player.raw["Weight"] || player.raw["weight"];
  const wf = Number(player.raw["Weak Foot"] || player.raw["weakFoot"] || 3);
  const skm = Number(player.raw["Skill Moves"] || player.raw["skillMoves"] || 3);
  const wrAtk = player.raw["Att. Work Rate"] || player.raw["attackWorkRate"] || "Med";
  const wrDef = player.raw["Def. Work Rate"] || player.raw["defenseWorkRate"] || "Med";

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${player.name} · ${player.rating} ${player.position} — FUTMAC FC 26`}</title>
        <meta name="description" content={`إحصائيات ${player.name} في EA SPORTS FC 26 — تقييم ${player.rating}, ${player.club} · ${player.nation}.`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${player.name} — ${player.rating} ${player.position}`} />
        <meta property="og:description" content={`${player.club} · ${player.nation} · إحصائيات EA FC 26 كاملة.`} />
        {player.cardUrl && <meta property="og:image" content={player.cardUrl} />}
      </Helmet>

      {/* Ambient hero backdrop */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 right-10 w-[520px] h-[520px] rounded-full bg-primary/15 blur-[140px] animate-pulse-glow" />
          <div className="absolute top-40 -left-20 w-[420px] h-[420px] rounded-full bg-primary-deep/20 blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-primary/[0.06] to-transparent" />
        </div>

        <div className="container mx-auto px-4 pt-4 pb-10 max-w-[1240px]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Breadcrumbs items={[
              { label: "اللاعبون", href: "/players" },
              { label: player.name },
            ]} />
            <button onClick={() => navigate(-1)} className="glass rounded-lg px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 hover:border-primary/40">
              <ArrowLeft className="w-3.5 h-3.5" /> رجوع
            </button>
          </div>

          {/* HERO — sidebar (card + quick info) + right (identity + face stats grid) */}
          <section className="grid lg:grid-cols-[300px_1fr] gap-5 mb-6 animate-fade-in">
            {/* Left column: card + info panel */}
            <aside className="flex flex-col gap-4">
              <div className="panel panel-glow p-5 flex flex-col items-center justify-center relative">
                {player.cardUrl && (
                  <img
                    src={player.cardUrl}
                    alt={player.name}
                    className="relative w-full max-w-[240px] object-contain drop-shadow-[0_25px_60px_hsl(var(--primary)/0.45)] animate-float"
                  />
                )}
                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                  <span className="rating-chip rating-chip-elite text-sm px-2.5 py-1">{player.rating}</span>
                  <span className="rating-chip text-sm px-2.5 py-1">{player.position}</span>
                  {player.altPositions.slice(0, 3).map((ap) => (
                    <span key={ap} className="text-[10px] font-black px-2 py-1 rounded-md glass-subtle border border-border/60 text-muted-foreground">{ap}</span>
                  ))}
                </div>
              </div>

              {/* Compact info panel — FUT.GG-style */}
              <div className="panel p-4">
                <p className="eyebrow mb-2">Player Info</p>
                <div className="divide-hair">
                  <InfoLine label="النادي" value={player.club || "—"} />
                  <InfoLine label="الدوري" value={player.league || "—"} />
                  <InfoLine label="المنتخب" value={player.nation || "—"} />
                  {height && <InfoLine label="الطول" value={height as any} icon={Ruler} />}
                  {weight && <InfoLine label="الوزن" value={weight as any} icon={Weight} />}
                  <InfoLine label="القدم" value={foot} icon={Footprints} />
                  <InfoLine label="معدل الهجوم" value={String(wrAtk)} />
                  <InfoLine label="معدل الدفاع" value={String(wrDef)} />
                  <StarRow n={skm} label="مهارات" />
                  <StarRow n={wf} label="القدم الأضعف" />
                </div>
              </div>

              {/* Actions */}
              <div className="panel p-3 flex flex-col gap-2">
                <button onClick={openCompare} className="btn-primary w-full text-xs py-2.5">
                  <GitCompare className="w-3.5 h-3.5" />
                  {inCompare ? "افتح المقارنة" : "قارن اللاعب"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => compare.toggle(player.id)} className={`btn-ghost text-xs py-2 ${inCompare ? "text-primary border-primary/50" : ""}`}>
                    <GitCompare className="w-3.5 h-3.5" />
                    {inCompare ? "في القائمة" : "أضف"}
                  </button>
                  <button onClick={() => toggle(player)} className="btn-ghost text-xs py-2">
                    <Heart className={`w-3.5 h-3.5 ${fav ? "fill-destructive text-destructive" : ""}`} />
                    {fav ? "مفضّل" : "المفضلة"}
                  </button>
                </div>
                {player.eaUrl && (
                  <a href={player.eaUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs py-2 w-full">
                    EA Sports <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </aside>

            {/* Right column: identity ribbon + face stats grid */}
            <div className="flex flex-col gap-4">
              <div className="panel panel-glow p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="eyebrow inline-flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> EA SPORTS FC 26
                    </p>
                    <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter mt-1 leading-none">
                      {player.name}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 font-semibold">
                      {player.club} <span className="text-primary/50">•</span> {player.league} <span className="text-primary/50">•</span> {player.nation}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-mono-num text-5xl font-black leading-none text-gradient-primary">{player.rating}</div>
                      <p className="text-[9px] tracking-[0.28em] font-black text-muted-foreground mt-1">OVERALL</p>
                    </div>
                    <div className="w-px h-14 bg-border/70" />
                    <div className="text-center">
                      <div className="font-mono-num text-5xl font-black leading-none text-foreground">{player.position}</div>
                      <p className="text-[9px] tracking-[0.28em] font-black text-muted-foreground mt-1">POSITION</p>
                    </div>
                  </div>
                </div>

                {/* PlayStyles pill row */}
                {player.playStyles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <p className="eyebrow mb-2">PlayStyles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {psPlus.map((ps) => (
                        <span key={ps} className="px-2.5 py-1 rounded-md text-[11px] font-black bg-gradient-primary text-primary-foreground shadow-lg inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> {ps}
                        </span>
                      ))}
                      {psBase.map((ps) => (
                        <span key={ps} className="px-2.5 py-1 rounded-md text-[11px] font-bold glass-subtle border border-border/60 text-foreground/85">{ps}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Face stats grid (FUT.GG-style bars) */}
              <FaceStats player={player} groups={groups} />
            </div>
          </section>

          {/* Radar + Chemistry + Price row */}
          <section className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="panel p-5">
              <p className="eyebrow mb-2">Attribute Radar</p>
              <h3 className="font-display font-black text-base mb-3">توزيع القدرات</h3>
              <StatRadar player={player} />
            </div>
            <ChemistryViz player={player} />
            <PriceTrend id={player.id} rating={player.rating} />
          </section>

          {/* Chem styles + evolution */}
          <section className="grid lg:grid-cols-2 gap-4 mb-6">
            {!player.isGK && <ChemistryStyles player={player} />}
            <EvolutionHistory player={player} />
          </section>

          {/* Info + game stats */}
          <section className="grid lg:grid-cols-2 gap-4 mb-6">
            <InfoTable player={player} />
            <GameStats player={player} />
          </section>

          {/* Other versions */}
          {versionsQ.data && versionsQ.data.length > 1 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="section-title">إصدارات أخرى</h2>
                <span className="text-xs text-muted-foreground">({versionsQ.data.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {versionsQ.data.map((v) => <VersionCard key={v.id} v={v} />)}
              </div>
            </section>
          )}

          {(sameClub.length > 0 || sameNation.length > 0 || better.length > 0 || cheaper.length > 0) && (
            <section className="mb-10">
              <h2 className="section-title mb-3">لاعبون مشابهون</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sameClub.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">من نفس النادي</p>
                    <div className="grid gap-2">{sameClub.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
                {sameNation.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">من نفس المنتخب</p>
                    <div className="grid gap-2">{sameNation.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
                {better.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">بدائل أفضل ({player.position})</p>
                    <div className="grid gap-2">{better.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
                {cheaper.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">بدائل أرخص ({player.position})</p>
                    <div className="grid gap-2">{cheaper.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailPage;
