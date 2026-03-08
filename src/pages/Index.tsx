import { useState, useMemo } from "react";
import { players } from "@/data/players";
import Header from "@/components/Header";
import PlayerCard from "@/components/PlayerCard";
import PlayerDetail from "@/components/PlayerDetail";
import Filters from "@/components/Filters";
import type { Player } from "@/data/players";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [selectedCardType, setSelectedCardType] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q)
      );
    }
    if (selectedPosition) result = result.filter((p) => p.position === selectedPosition);
    if (selectedLeague) result = result.filter((p) => p.league === selectedLeague);
    if (selectedCardType) result = result.filter((p) => p.cardType === selectedCardType);

    switch (sortBy) {
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    return result;
  }, [searchQuery, selectedPosition, selectedLeague, selectedCardType, sortBy]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-6">
        {/* Hero stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "إجمالي اللاعبين", value: players.length.toString(), icon: "⚽" },
            { label: "أعلى تقييم", value: "97", icon: "⭐" },
            { label: "أغلى لاعب", value: "9.5M", icon: "💰" },
            { label: "TOTY", value: players.filter(p => p.cardType === "toty").length.toString(), icon: "🏆" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-lg font-heading font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Filters
            selectedPosition={selectedPosition}
            onPositionChange={setSelectedPosition}
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
            selectedCardType={selectedCardType}
            onCardTypeChange={setSelectedCardType}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          عرض {filteredPlayers.length} لاعب
        </p>

        {/* Player grid */}
        {filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl mb-2">😔</p>
            <p className="text-muted-foreground">ما لقينا لاعبين بالفلاتر هذي</p>
          </div>
        )}
      </main>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
};

export default Index;
