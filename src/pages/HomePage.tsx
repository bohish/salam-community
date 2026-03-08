import { useState } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { usePromos } from "@/hooks/usePromos";
import PlayerMiniCard from "@/components/PlayerMiniCard";
import PlayerDetail from "@/components/PlayerDetail";
import type { Player } from "@/types/player";
import { Sparkles, Clock, CalendarDays, Star, Flame, Shield, Target, Zap } from "lucide-react";

const playerTabs = [
  { id: "popular", label: "الأكثر شعبية", icon: Flame },
  { id: "top-rated", label: "الأعلى تقييماً", icon: Star },
  { id: "attackers", label: "المهاجمين", icon: Target },
  { id: "midfielders", label: "الوسط", icon: Zap },
  { id: "defenders", label: "الدفاع", icon: Shield },
];

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("popular");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: topData, isLoading: topLoading } = usePlayers({ limit: 30, offset: 0 });
  const { data: page2Data } = usePlayers({ limit: 30, offset: 30 });
  const { data: promosData, isLoading: promosLoading } = usePromos();

  const allPlayers = [
    ...(topData?.players || []),
    ...(page2Data?.players || []),
  ];

  const getFilteredPlayers = () => {
    switch (activeTab) {
      case "popular": return allPlayers.slice(0, 20);
      case "top-rated": return [...allPlayers].sort((a, b) => b.rating - a.rating).slice(0, 20);
      case "attackers": return allPlayers.filter(p => ["ST", "LW", "RW", "LM", "RM", "CF"].includes(p.position));
      case "midfielders": return allPlayers.filter(p => ["CM", "CAM", "CDM"].includes(p.position));
      case "defenders": return allPlayers.filter(p => ["CB", "LB", "RB", "LWB", "RWB", "GK"].includes(p.position));
      default: return allPlayers.slice(0, 20);
    }
  };

  const filteredPlayers = getFilteredPlayers();
  const total = topData?.total || 0;
  const currentPromo = promosData?.currentPromo;
  const recentPromos = promosData?.recentPromos || [];
  const totw = promosData?.totw;
  const upcomingPromos = promosData?.upcomingPromos || [];

  return (
    <div className="container mx-auto px-4 py-4" dir="rtl">
      
      {/* Current Promo Banner */}
      {currentPromo && (
        <div 
          className="rounded-xl p-4 mb-5 border border-border relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${currentPromo.color}22, ${currentPromo.color}08)` }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: currentPromo.color }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} style={{ color: currentPromo.color }} />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${currentPromo.color}30`, color: currentPromo.color }}>
                حدث نشط
              </span>
            </div>
            <h2 className="font-extrabold text-xl text-foreground mb-1">{currentPromo.nameAr || currentPromo.name}</h2>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{currentPromo.descriptionAr || currentPromo.description}</p>
            
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                {currentPromo.startDate} → {currentPromo.endDate}
              </span>
              {currentPromo.players && (
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  {currentPromo.players.length} لاعب
                </span>
              )}
            </div>

            {/* Promo Players */}
            {currentPromo.players && currentPromo.players.length > 0 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {currentPromo.players.map((player, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0 w-[72px]">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white mb-1"
                      style={{ background: `linear-gradient(135deg, ${currentPromo.color}, ${currentPromo.color}88)` }}
                    >
                      {player.rating}
                    </div>
                    <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">
                      {player.name.split(" ").pop()}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{player.position}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOTW Section */}
      {totw && totw.players && totw.players.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center">
              <span className="text-xs">⚡</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">TOTW - الأسبوع {totw.week}</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {totw.players.map((player, i) => (
              <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shrink-0">
                <span className="text-sm font-extrabold text-primary">{player.rating}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{player.name}</p>
                  <p className="text-[10px] text-muted-foreground">{player.position} • {player.club}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Promos */}
      {recentPromos.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-muted-foreground" />
            <h3 className="font-bold text-sm text-foreground">الأحداث السابقة</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {recentPromos.map((promo, i) => (
              <div 
                key={i} 
                className="shrink-0 w-[200px] bg-card border border-border rounded-lg p-3"
                style={{ borderLeftColor: promo.color, borderLeftWidth: 3 }}
              >
                <p className="font-bold text-xs text-foreground mb-1">{promo.nameAr || promo.name}</p>
                <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{promo.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{promo.playerCount} لاعب</span>
                  {promo.topPlayer && (
                    <span className="text-[10px] font-bold text-primary">{promo.topPlayer.name} {promo.topPlayer.rating}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Promos */}
      {upcomingPromos.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-muted-foreground" />
            <h3 className="font-bold text-sm text-foreground">الأحداث القادمة</h3>
          </div>
          <div className="space-y-2">
            {upcomingPromos.map((promo, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-foreground">{promo.nameAr || promo.name}</p>
                  <p className="text-[10px] text-muted-foreground">{promo.description}</p>
                </div>
                <span className="text-[10px] text-primary font-semibold shrink-0 mr-3">{promo.expectedDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promos loading */}
      {promosLoading && (
        <div className="bg-card border border-border rounded-xl p-6 mb-5 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">جاري تحميل الأحداث...</span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-5 overflow-x-auto hide-scrollbar">
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2 shrink-0">
          <span className="text-lg">⚽</span>
          <div>
            <p className="text-sm font-bold text-foreground">{total.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">لاعب</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2 shrink-0">
          <span className="text-lg">⭐</span>
          <div>
            <p className="text-sm font-bold text-foreground">FC 25</p>
            <p className="text-[10px] text-muted-foreground">بيانات رسمية</p>
          </div>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center gap-2 shrink-0">
          <span className="text-lg">🔄</span>
          <div>
            <p className="text-sm font-bold text-primary">مباشر</p>
            <p className="text-[10px] text-muted-foreground">تحديث تلقائي</p>
          </div>
        </div>
      </div>

      {/* Player Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5">
        {playerTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:border-primary/50"
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {topLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Players Grid */}
      {!topLoading && (
        <div className="space-y-4">
          <div className="flex overflow-x-auto gap-3 hide-scrollbar pb-2">
            {filteredPlayers.slice(0, 10).map((player) => (
              <PlayerMiniCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
            ))}
          </div>
          {filteredPlayers.length > 10 && (
            <div className="flex overflow-x-auto gap-3 hide-scrollbar pb-2">
              {filteredPlayers.slice(10, 20).map((player) => (
                <PlayerMiniCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
};

export default HomePage;
