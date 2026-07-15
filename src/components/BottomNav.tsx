import { Home, Users, Heart, GitCompare, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompare } from "@/hooks/useCompare";
import { useFavorites } from "@/hooks/useFavorites";

const tabs = [
  { path: "/", icon: Home, label: "الرئيسية" },
  { path: "/players", icon: Users, label: "اللاعبين" },
  { path: "/search", icon: Search, label: "بحث" },
  { path: "/compare", icon: GitCompare, label: "مقارنة" },
  { path: "/favorites", icon: Heart, label: "المفضلة" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { players: compareList } = useCompare();
  const { favorites } = useFavorites();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pt-2 px-3 pb-3">
      <div className="glass-strong rounded-2xl max-w-lg mx-auto shadow-2xl">
        <div className="flex items-center justify-around h-16 px-1">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === "/players" && location.pathname.startsWith("/player"));
            const badge = tab.path === "/compare" ? compareList.length : tab.path === "/favorites" ? favorites.length : 0;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-fluid ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl -z-10" />
                )}
                <div className="relative">
                  <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
