import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, ExternalLink, GitCompare } from "lucide-react";
import { usePlayerById } from "@/hooks/useFc26";
import { buildStatGroups } from "@/types/player";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/Skeleton";
import { parseIdFromSlug, playerSlug } from "@/lib/slug";

const StatBar = ({ label, value }: { label: string; value: number }) => {
  const color = value >= 85 ? "bg-primary" : value >= 70 ? "bg-accent" : value >= 50 ? "bg-gold" : "bg-destructive";
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-8 text-right font-bold">{value}</span>
    </div>
  );
};

const MainStat = ({ label, value }: { label: string; value: number }) => (
  <div className="glass rounded-xl p-3 text-center">
    <p className="text-xs text-muted-foreground font-semibold mb-1">{label}</p>
    <p className="text-2xl font-black text-gradient-primary">{value}</p>
  </div>
);

const Meta = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value || "—"}</span>
  </div>
);

const PlayerDetailPage = () => {
  const { id: rawParam } = useParams();
  const numericId = parseIdFromSlug(rawParam || "");
  const { data: player, isLoading, error } = usePlayerById(numericId);
  const { isFavorite, toggle } = useFavorites();
  const compare = useCompare();

  if (isLoading) return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-72" />
      <Skeleton className="h-40" />
    </div>
  );

  if (error || !player) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <p className="text-destructive mb-2">تعذّر تحميل بيانات اللاعب.</p>
      <Link to="/" className="text-primary text-sm">العودة للرئيسية</Link>
    </div>
  );

  const groups = buildStatGroups(player);
  const fav = isFavorite(player.id);
  const inCompare = compare.has(player.id);
  const canonical = `/player/${playerSlug(player.name, player.id)}`;

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <Helmet>
        <title>{player.name} · {player.rating} {player.position} — FUTHUB FC 26</title>
        <meta name="description" content={`إحصائيات وتفاصيل ${player.name} في EA SPORTS FC 26. تقييم ${player.rating}, ${player.club} · ${player.nation}.`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${player.name} — ${player.rating} ${player.position}`} />
        <meta property="og:description" content={`${player.club} · ${player.nation} · إحصائيات EA FC 26 كاملة.`} />
        <meta property="og:url" content={canonical} />
        {player.cardUrl && <meta property="og:image" content={player.cardUrl} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: player.name,
          nationality: player.nation,
          affiliation: player.club,
          jobTitle: `${player.position} · EA SPORTS FC 26`,
        })}</script>
      </Helmet>

      <Breadcrumbs items={[
        { label: "اللاعبون", href: "/players" },
        { label: player.name },
      ]} />

      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={() => compare.toggle(player.id)}
          className={`glass px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold ${inCompare ? "text-primary" : ""}`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          {inCompare ? "في المقارنة" : "أضف للمقارنة"}
        </button>
        <button
          onClick={() => toggle(player)}
          className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold"
        >
          <Heart className={`w-3.5 h-3.5 ${fav ? "fill-destructive text-destructive" : ""}`} />
          {fav ? "في المفضلة" : "أضف للمفضلة"}
        </button>
      </div>

      <div className="card-premium rounded-3xl p-5 mb-6 flex flex-col md:flex-row items-center gap-5">
        <div className="w-40 h-56 flex items-center justify-center shrink-0">
          {player.cardUrl && (
            <img src={player.cardUrl} alt={player.name} className="w-full h-full object-contain drop-shadow-2xl animate-float" />
          )}
        </div>
        <div className="flex-1 text-center md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="rating-chip rating-chip-elite text-base px-3 py-1">{player.rating}</span>
            <span className="rating-chip text-base px-3 py-1">{player.position}</span>
          </div>
          <h1 className="text-3xl font-black mb-1">{player.name}</h1>
          <p className="text-sm text-muted-foreground mb-3">{player.club} · {player.league} · {player.nation}</p>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
            {player.isGK ? (
              <>
                <MainStat label="DIV" value={parseInt(player.raw["GK Diving"] || "0")} />
                <MainStat label="HAN" value={parseInt(player.raw["GK Handling"] || "0")} />
                <MainStat label="KIC" value={parseInt(player.raw["GK Kicking"] || "0")} />
                <MainStat label="REF" value={parseInt(player.raw["GK Reflexes"] || "0")} />
                <MainStat label="SPD" value={player.pace} />
                <MainStat label="POS" value={parseInt(player.raw["GK Positioning"] || "0")} />
              </>
            ) : (
              <>
                <MainStat label="PAC" value={player.pace} />
                <MainStat label="SHO" value={player.shooting} />
                <MainStat label="PAS" value={player.passing} />
                <MainStat label="DRI" value={player.dribbling} />
                <MainStat label="DEF" value={player.defending} />
                <MainStat label="PHY" value={player.physical} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-black mb-2">معلومات</h3>
          <Meta label="العمر" value={player.age} />
          <Meta label="الطول" value={player.height} />
          <Meta label="الوزن" value={player.weight} />
          <Meta label="القدم" value={player.preferredFoot} />
          <Meta label="القدم الضعيفة" value={`${player.weakFoot}★`} />
          <Meta label="المهارات" value={`${player.skillMoves}★`} />
          <Meta label="المراكز البديلة" value={player.altPositions.join(" · ") || "—"} />
        </div>

        <div className="glass rounded-2xl p-4 md:col-span-2">
          <h3 className="text-sm font-black mb-2">أساليب اللعب</h3>
          {player.playStyles.length ? (
            <div className="flex flex-wrap gap-2">
              {player.playStyles.map((ps) => {
                const plus = ps.endsWith("+");
                return (
                  <span key={ps}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${plus ? "bg-gradient-primary text-primary-foreground" : "glass"}`}>
                    {ps}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد أساليب لعب مسجلة.</p>
          )}
          {player.eaUrl && (
            <a href={player.eaUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-primary">
              مصدر EA <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.title} className="glass rounded-2xl p-4">
            <h3 className="text-sm font-black mb-3">{g.title}</h3>
            <div className="grid gap-2">
              {g.stats.map((s) => <StatBar key={s.key} label={s.label} value={s.value} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerDetailPage;
