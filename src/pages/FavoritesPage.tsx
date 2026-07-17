import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, LogIn } from "lucide-react";
import { toast } from "sonner";

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading } = useFavorites();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const remove = async (playerId: number) => {
    if (!user) return;
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("player_id", playerId);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["favorites"] });
    toast.success("تمت الإزالة من المفضلة");
  };

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
        <Helmet><title>المفضلة | futmac.com</title></Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md mx-auto animate-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Heart size={28} className="text-destructive" />
            </div>
            <h2 className="font-black text-xl mb-2">سجل دخولك أولاً</h2>
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
        <title>المفضلة | futmac.com</title>
        <meta name="description" content="اللاعبين المفضلين لديك في futmac.com." />
      </Helmet>

      <div className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black">المفضلة</h1>
          <p className="text-xs text-muted-foreground">{favorites.length} لاعب محفوظ</p>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 glass rounded-2xl animate-shimmer" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center animate-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Heart size={28} className="text-primary" />
            </div>
            <h2 className="font-black text-xl mb-2">لا يوجد لاعبين مفضلين</h2>
            <p className="text-sm text-muted-foreground mb-6">اضغط على القلب في أي لاعب لحفظه هنا</p>
            <Link to="/search" className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-lg glow-hover">
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
                <div className="w-12 h-16 shrink-0 flex items-center justify-center">
                  {fav.player_avatar_url && (
                    <img src={fav.player_avatar_url} alt={fav.player_name} className="w-full h-full object-contain" loading="lazy" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{fav.player_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{fav.player_position} • {fav.player_club}</p>
                </div>
                <span className={`rating-chip ${fav.player_rating >= 86 ? "rating-chip-elite" : ""}`}>
                  {fav.player_rating}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(fav.player_id); }}
                  className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-fluid"
                  aria-label="إزالة"
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
