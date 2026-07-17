import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, ExternalLink, GitCompare, Layers, ArrowLeft, Sparkles } from "lucide-react";
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
    className="glass rounded-2xl p-3 flex flex-col items-center gap-2 hover:glass-strong hover-lift transition-fluid text-center shrink-0 w-36"
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
    <p className="text-[10px] font-bold text-primary truncate w-full">{categoryLabel(v)}</p>
  </a>
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

  return (
    <div className="min-h-screen bg-mesh">
      <Helmet>
        <title>{`${player.name} · ${player.rating} ${player.position} — FUTMAC FC 26`}</title>
        <meta name="description" content={`إحصائيات وتفاصيل ${player.name} في EA SPORTS FC 26. تقييم ${player.rating}, ${player.club} · ${player.nation}.`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${player.name} — ${player.rating} ${player.position}`} />
        <meta property="og:description" content={`${player.club} · ${player.nation} · إحصائيات EA FC 26 كاملة.`} />
        {player.cardUrl && <meta property="og:image" content={player.cardUrl} />}
      </Helmet>

      {/* Ambient glow backdrop */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 right-10 w-96 h-96 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
          <div className="absolute top-40 -left-20 w-96 h-96 rounded-full bg-accent/15 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 pt-4 pb-10 max-w-6xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Breadcrumbs items={[
              { label: "اللاعبون", href: "/players" },
              { label: player.name },
            ]} />
            <button onClick={() => navigate(-1)} className="glass rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 hover:border-primary/40">
              <ArrowLeft className="w-3.5 h-3.5" /> رجوع
            </button>
          </div>

          {/* HERO: large card left + identity right */}
          <section className="grid lg:grid-cols-[340px_1fr] gap-6 mb-6 animate-fade-in">
            <div className="card-premium rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary/10" />
              <div className="absolute -inset-16 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.35),transparent_60%)] blur-2xl" />
              {player.cardUrl && (
                <img
                  src={player.cardUrl}
                  alt={player.name}
                  className="relative w-full max-w-[260px] object-contain drop-shadow-[0_20px_50px_hsl(var(--primary)/0.5)] animate-float"
                />
              )}
              <div className="relative flex items-center gap-2 mt-4 flex-wrap justify-center">
                <span className="rating-chip rating-chip-elite text-base px-3 py-1.5">{player.rating}</span>
                <span className="rating-chip text-base px-3 py-1.5">{player.position}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="glass-strong rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-primary/10 blur-3xl" />
                <div className="relative">
                  <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-1 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> EA SPORTS FC 26
                  </p>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight text-gradient-primary">{player.name}</h1>
                  <p className="text-sm text-muted-foreground mt-2 font-semibold">
                    {player.club} <span className="text-primary/60">·</span> {player.league} <span className="text-primary/60">·</span> {player.nation}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button onClick={openCompare} className="btn-primary text-xs px-4 py-2">
                      <GitCompare className="w-3.5 h-3.5" />
                      {inCompare ? "افتح المقارنة" : "قارن اللاعب"}
                    </button>
                    <button onClick={() => compare.toggle(player.id)} className={`btn-ghost text-xs px-4 py-2 ${inCompare ? "text-primary border-primary/50" : ""}`}>
                      <GitCompare className="w-3.5 h-3.5" />
                      {inCompare ? "في المقارنة" : "أضف للمقارنة"}
                    </button>
                    <button onClick={() => toggle(player)} className="btn-ghost text-xs px-4 py-2">
                      <Heart className={`w-3.5 h-3.5 ${fav ? "fill-destructive text-destructive" : ""}`} />
                      {fav ? "في المفضلة" : "المفضلة"}
                    </button>
                    {player.eaUrl && (
                      <a href={player.eaUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs px-4 py-2">
                        EA <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Face stat pills */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {(player.isGK
                  ? [
                      ["DIV", +player.raw["GK Diving"] || 0],
                      ["HAN", +player.raw["GK Handling"] || 0],
                      ["KIC", +player.raw["GK Kicking"] || 0],
                      ["REF", +player.raw["GK Reflexes"] || 0],
                      ["SPD", player.pace],
                      ["POS", +player.raw["GK Positioning"] || 0],
                    ]
                  : [
                      ["PAC", player.pace], ["SHO", player.shooting], ["PAS", player.passing],
                      ["DRI", player.dribbling], ["DEF", player.defending], ["PHY", player.physical],
                    ]).map(([l, v]) => (
                  <div key={l as string} className="glass rounded-2xl p-3 text-center hover:border-primary/40 hover-lift transition-fluid">
                    <p className="text-[10px] font-black tracking-widest text-muted-foreground">{l}</p>
                    <p className="text-2xl font-black text-gradient-primary tabular-nums">{v as number}</p>
                  </div>
                ))}
              </div>

              {/* PlayStyles */}
              {player.playStyles.length > 0 && (
                <div className="glass rounded-2xl p-4">
                  <h3 className="text-xs font-black tracking-widest uppercase text-muted-foreground mb-3">أساليب اللعب</h3>
                  <div className="space-y-2.5">
                    {psPlus.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {psPlus.map((ps) => (
                          <span key={ps} className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-gradient-primary text-primary-foreground shadow-lg inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> {ps}
                          </span>
                        ))}
                      </div>
                    )}
                    {psBase.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {psBase.map((ps) => (
                          <span key={ps} className="px-2.5 py-1 rounded-lg text-[11px] font-bold glass-subtle border border-border/60">{ps}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {player.altPositions.length > 0 && (
                <div className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">مراكز بديلة</span>
                  {player.altPositions.map((ap) => (
                    <span key={ap} className="rating-chip">{ap}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Face stats detailed */}
          <section className="mb-6">
            <h2 className="section-title mb-3">الإحصائيات التفصيلية</h2>
            <FaceStats player={player} groups={groups} />
          </section>

          {/* Radar + Chemistry + Price row */}
          <section className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="glass-strong rounded-2xl p-4">
              <h3 className="text-sm font-black tracking-wider uppercase mb-2">مخطط الرادار</h3>
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

          {/* Similar players */}
          {(sameClub.length > 0 || sameNation.length > 0 || better.length > 0 || cheaper.length > 0) && (
            <section className="mb-10">
              <h2 className="section-title mb-3">لاعبون مشابهون</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sameClub.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-muted-foreground mb-2">من نفس النادي</p>
                    <div className="grid gap-2">{sameClub.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
                {sameNation.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-muted-foreground mb-2">من نفس المنتخب</p>
                    <div className="grid gap-2">{sameNation.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
                {better.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-muted-foreground mb-2">بدائل أفضل ({player.position})</p>
                    <div className="grid gap-2">{better.map((p) => <PlayerListRow key={p.id} player={p} />)}</div>
                  </div>
                )}
                {cheaper.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-muted-foreground mb-2">بدائل أرخص ({player.position})</p>
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
