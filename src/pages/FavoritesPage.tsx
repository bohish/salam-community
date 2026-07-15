import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Trash2, LogIn } from "lucide-react";

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading, toggle } = useFavorites();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Helmet><title>المفضلة | FUTHUB</title></Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md mx-auto animate-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Heart size={28} className="text-destructive" />
            </div>
            <h2 className="font-black text-xl text-foreground mb-2">سجل دخولك أولاً</h2>
            <p className="text-sm text-muted-foreground mb-6">لحفظ لاعبيك المفضلين والوصول إليهم من أي جهاز</p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-lg glow-hover"
            >
              <LogIn size={16} /> تسجيل الدخول
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>المفضلة | FUTHUB</title>
        <meta name="description" content="اللاعبين المفضلين لديك في FUTHUB." />
      </Helmet>

      <div className="container mx-auto px-4 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground">المفضلة</h1>
          <p className="text-xs text-muted-foreground">{favorites.length} لاعب محفوظ</p>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 glass rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center animate-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Heart size={28} className="text-primary" />
            </div>
            <h2 className="font-black text-xl text-foreground mb-2">لا يوجد لاعبين مفضلين</h2>
            <p className="text-sm text-muted-foreground mb-6">اضغط على القلب في أي لاعب لحفظه هنا</p>
            <Link
              to="/players"
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-lg glow-hover"
            >
              تصفح اللاعبين
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="glass-strong rounded-2xl p-3 flex items-center gap-3 hover:border-primary/50 transition-fluid animate-in cursor-pointer group"
                onClick={() => navigate(`/player/${fav.player_id}`)}
              >
                <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden shrink-0">
                  {fav.player_avatar_url && (
                    <img src={fav.player_avatar_url} alt={fav.player_name} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{fav.player_name}</p>
                  <p className="text-xs text-muted-foreground">{fav.player_position} • {fav.player_club}</p>
                </div>
                <span className={`rating-chip ${fav.player_rating >= 86 ? "rating-chip-elite" : ""}`}>
                  {fav.player_rating}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle({
                      id: fav.player_id,
                      name: fav.player_name,
                      rating: fav.player_rating,
                      position: fav.player_position || "",
                      avatarUrl: fav.player_avatar_url || "",
                      club: fav.player_club || "",
                      nation: fav.player_nation || "",
                      nationImage: "",
                      clubImage: "",
                      league: "",
                      shieldUrl: "",
                      pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
                      skillMoves: 0, weakFoot: 0, height: 0, weight: 0, birthdate: "",
                      alternatePositions: [], playStyles: [], playStylesPlus: [],
                    });
                  }}
                  className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-fluid"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FavoritesPage;
