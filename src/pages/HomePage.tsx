import { useState } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import PlayerMiniCard from "@/components/PlayerMiniCard";
import PlayerDetail from "@/components/PlayerDetail";
import type { Player } from "@/types/player";

const tabs = [
  { id: "popular", label: "🔥 الأكثر شعبية" },
  { id: "new", label: "🆕 لاعبين جدد" },
  { id: "top-rated", label: "⭐ الأعلى تقييماً" },
  { id: "attackers", label: "⚽ المهاجمين" },
  { id: "midfielders", label: "🎯 الوسط" },
  { id: "defenders", label: "🛡️ الدفاع" },
];

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("popular");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: topData, isLoading: topLoading } = usePlayers({ limit: 20, offset: 0 });
  const { data: page2Data } = usePlayers({ limit: 20, offset: 20 });
  const { data: page3Data } = usePlayers({ limit: 20, offset: 40 });

  const allPlayers = [
    ...(topData?.players || []),
    ...(page2Data?.players || []),
    ...(page3Data?.players || []),
  ];

  const getFilteredPlayers = () => {
    switch (activeTab) {
      case "popular": return allPlayers.slice(0, 20);
      case "new": return [...allPlayers].reverse().slice(0, 20);
      case "top-rated": return [...allPlayers].sort((a, b) => b.rating - a.rating).slice(0, 20);
      case "attackers": return allPlayers.filter(p => ["ST", "LW", "RW", "LM", "RM", "CF"].includes(p.position));
      case "midfielders": return allPlayers.filter(p => ["CM", "CAM", "CDM", "LM", "RM"].includes(p.position));
      case "defenders": return allPlayers.filter(p => ["CB", "LB", "RB", "LWB", "RWB", "GK"].includes(p.position));
      default: return allPlayers.slice(0, 20);
    }
  };

  const filteredPlayers = getFilteredPlayers();
  const total = topData?.total || 0;

  return (
    <div className="container mx-auto px-4 py-4" dir="rtl">
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

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:border-primary/50"
            }`}
          >
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

      {/* Players Grid - FUTBIN style scrollable rows */}
      {!topLoading && (
        <div className="space-y-6">
          {/* Row 1 */}
          <div>
            <div className="flex overflow-x-auto gap-3 hide-scrollbar pb-2">
              {filteredPlayers.slice(0, 10).map((player) => (
                <PlayerMiniCard
                  key={player.id}
                  player={player}
                  onClick={() => setSelectedPlayer(player)}
                />
              ))}
            </div>
          </div>

          {/* Row 2 */}
          {filteredPlayers.length > 10 && (
            <div>
              <div className="flex overflow-x-auto gap-3 hide-scrollbar pb-2">
                {filteredPlayers.slice(10, 20).map((player) => (
                  <PlayerMiniCard
                    key={player.id}
                    player={player}
                    onClick={() => setSelectedPlayer(player)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Full grid for remaining */}
          {filteredPlayers.length > 20 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredPlayers.slice(20).map((player) => (
                <PlayerMiniCard
                  key={player.id}
                  player={player}
                  onClick={() => setSelectedPlayer(player)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
};

export default HomePage;
