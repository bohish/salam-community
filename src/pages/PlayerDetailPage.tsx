import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePlayers } from "@/hooks/usePlayers";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { ArrowRight, Heart, GitCompare, Ruler, Weight, Star as StarIcon } from "lucide-react";
import { useMemo } from "react";

const StatBar = ({ label, value }: { label: string; value: number }) => {
  const color =
    value >= 90 ? "from-cyan-400 to-primary" :
    value >= 80 ? "from-primary to-primary-glow" :
    value >= 70 ? "from-yellow-500 to-amber-500" :
    "from-orange-500 to-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-muted-foreground">{label}</span>
        <span className="font-black text-foreground">{value}</span>
      </div>
      <div className="h-2 bg-secondary/70 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const PlayerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerId = Number(id);

  // Search across all pages for now (basic)
  const { data: page1, isLoading } = usePlayers({ limit: 100, offset: 0 });
  const { data: page2 } = usePlayers({ limit: 100, offset: 100 });
  const { data: page3 } = usePlayers({ limit: 100, offset: 200 });

  const player = useMemo(() => {
    const all = [...(page1?.players || []), ...(page2?.players || []), ...(page3?.players || [])];
    return all.find((p) => p.id === playerId);
  }, [page1, page2, page3, playerId]);

  const { isFavorite, toggle } = useFavorites();
  const { has: inCompare, add: addCompare, remove: removeCompare } = useCompare();

  if (isLoading && !player) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-muted-foreground mb-4">اللاعب غير موجود في هذه الصفحة</p>
        <Link to="/players" className="text-primary hover:underline">← تصفح اللاعبين</Link>
      </div>
    );
  }

  const fav = isFavorite(player.id);
  const cmp = inCompare(player.id);

  const isGK = player.position === "GK";

  return (
    <>
      <Helmet>
        <title>{player.name} - {player.rating} {player.position} | FUTHUB</title>
        <meta name="description" content={`${player.name} - ${player.club}, ${player.league}. تقييم ${player.rating}, مركز ${player.position}. إحصائيات كاملة على FUTHUB.`} />
        <link rel="canonical" href={`/player/${player.id}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-4">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-fluid"
        >
          <ArrowRight size={16} /> رجوع
        </button>

        {/* Hero */}
        <div className="relative glass-strong rounded-3xl p-6 mb-6 overflow-hidden animate-in">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/15 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-transparent p-1">
                <div className="w-full h-full rounded-full bg-card overflow-hidden">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-black text-muted-foreground/30">
                      {player.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <span className={`rating-chip text-lg px-4 py-1.5 ${player.rating >= 86 ? "rating-chip-elite" : ""}`}>
                  {player.rating}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                {player.nationImage && <img src={player.nationImage} alt={player.nation} className="w-6 h-4 object-contain" />}
                <span className="text-xs text-muted-foreground">{player.nation}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">{player.name}</h1>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                {player.clubImage && <img src={player.clubImage} alt={player.club} className="w-5 h-5 object-contain" />}
                <p className="text-sm text-muted-foreground">{player.club} • {player.league}</p>
              </div>

              {/* Position & alt */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                <span className="bg-gradient-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-full">
                  {player.position}
                </span>
                {player.alternatePositions.map((pos) => (
                  <span key={pos} className="glass text-xs font-bold text-foreground px-3 py-1 rounded-full">
                    {pos}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-center md:justify-start">
                <button
                  onClick={() => toggle(player)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-fluid ${
                    fav ? "bg-destructive/20 text-destructive" : "glass hover:bg-destructive/10"
                  }`}
                >
                  <Heart size={14} fill={fav ? "currentColor" : "none"} />
                  {fav ? "في المفضلة" : "أضف للمفضلة"}
                </button>
                <button
                  onClick={() => cmp ? removeCompare(player.id) : addCompare(player)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-fluid ${
                    cmp ? "bg-primary/20 text-primary" : "glass hover:bg-primary/10"
                  }`}
                >
                  <GitCompare size={14} />
                  {cmp ? "في المقارنة" : "قارن"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="glass-strong rounded-2xl p-5 animate-in">
            <h2 className="font-black text-lg text-foreground mb-4">الإحصائيات الرئيسية</h2>
            <div className="space-y-3">
              <StatBar label="PAC" value={player.pace} />
              <StatBar label="SHO" value={player.shooting} />
              <StatBar label="PAS" value={player.passing} />
              <StatBar label="DRI" value={player.dribbling} />
              <StatBar label="DEF" value={player.defending} />
              <StatBar label="PHY" value={player.physical} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Attributes */}
            <div className="glass-strong rounded-2xl p-5 animate-in">
              <h2 className="font-black text-lg text-foreground mb-4">المواصفات</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <StarIcon size={18} className="text-gold" />
                  <div>
                    <p className="text-xs text-muted-foreground">مهارات</p>
                    <p className="font-black text-foreground">{player.skillMoves}★</p>
                  </div>
                </div>
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <StarIcon size={18} className="text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">القدم الأضعف</p>
                    <p className="font-black text-foreground">{player.weakFoot}★</p>
                  </div>
                </div>
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <Ruler size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">الطول</p>
                    <p className="font-black text-foreground">{player.height}cm</p>
                  </div>
                </div>
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <Weight size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">الوزن</p>
                    <p className="font-black text-foreground">{player.weight}kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Play styles */}
            {(player.playStyles.length > 0 || player.playStylesPlus.length > 0) && (
              <div className="glass-strong rounded-2xl p-5 animate-in">
                <h2 className="font-black text-lg text-foreground mb-4">أنماط اللعب</h2>
                {player.playStylesPlus.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-primary mb-2">PlayStyles+</p>
                    <div className="flex flex-wrap gap-1.5">
                      {player.playStylesPlus.map((ps) => (
                        <span key={ps.name} className="text-xs bg-gradient-primary text-primary-foreground font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          {ps.icon && <img src={ps.icon} alt="" className="w-3 h-3" />}
                          {ps.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {player.playStyles.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">PlayStyles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {player.playStyles.map((ps) => (
                        <span key={ps.name} className="text-xs glass text-foreground px-2.5 py-1 rounded-lg flex items-center gap-1">
                          {ps.icon && <img src={ps.icon} alt="" className="w-3 h-3" />}
                          {ps.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerDetailPage;
