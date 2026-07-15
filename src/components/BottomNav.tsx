import { Home, Search, Sparkles, GitCompare, Heart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";

const BottomNav = () => {
  const { favorites } = useFavorites();
  const compare = useCompare();

  const tabs = [
    { path: "/", icon: Home, label: "الرئيسية", end: true },
    { path: "/search", icon: Search, label: "بحث" },
    { path: "/events", icon: Sparkles, label: "الأحداث" },
    { path: "/compare", icon: GitCompare, label: "مقارنة", badge: compare.count },
    { path: "/favorites", icon: Heart, label: "المفضلة", badge: favorites.length },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pt-2 px-3 pb-3">
      <div className="glass-strong rounded-2xl max-w-lg mx-auto shadow-2xl">
        <div className="flex items-center justify-around h-16 px-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-fluid ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute inset-0 bg-primary/10 rounded-xl -z-10" />}
                  <div className="relative">
                    <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    {tab.badge ? (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                        {tab.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
