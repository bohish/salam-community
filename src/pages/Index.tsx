import { useState, useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import Header from "@/components/Header";
import PlayerCard from "@/components/PlayerCard";
import PlayerDetail from "@/components/PlayerDetail";
import Filters from "@/components/Filters";
import type { Player } from "@/types/player";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = usePlayers({
    limit: 100,
    offset: page * 100,
    gender: "0",
  });

  const players = data?.players || [];
  const total = data?.total || 0;

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

    switch (sortBy) {
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    return result;
  }, [searchQuery, selectedPosition, selectedLeague, sortBy, players]);

  // Get unique leagues from current data
  const leagues = useMemo(() => {
    return [...new Set(players.map(p => p.league))].sort();
  }, [players]);

  const positions = useMemo(() => {
    return [...new Set(players.map(p => p.position))].sort();
  }, [players]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-6">
        {/* Hero stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "إجمالي اللاعبين", value: total.toLocaleString(), icon: "⚽" },
            { label: "أعلى تقييم", value: players.length > 0 ? Math.max(...players.map(p => p.rating)).toString() : "-", icon: "⭐" },
            { label: "الصفحة الحالية", value: `${page + 1}`, icon: "📄" },
            { label: "بيانات EA الرسمية", value: "FC 25", icon: "🏆" },
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
            selectedCardType=""
            onCardTypeChange={() => {}}
            sortBy={sortBy}
            onSortChange={setSortBy}
            leagues={leagues}
            positions={positions}
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          عرض {filteredPlayers.length} لاعب من {total.toLocaleString()}
        </p>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-20">
            <p className="text-2xl mb-2 animate-spin">⚽</p>
            <p className="text-muted-foreground">جاري تحميل اللاعبين...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <p className="text-2xl mb-2">❌</p>
            <p className="text-destructive">خطأ في تحميل البيانات</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
        )}

        {/* Player grid */}
        {!isLoading && !error && filteredPlayers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredPlayers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl mb-2">😔</p>
            <p className="text-muted-foreground">ما لقينا لاعبين بالفلاتر هذي</p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > 100 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm disabled:opacity-50 hover:bg-secondary/80 transition-colors"
            >
              السابق
            </button>
            <span className="text-sm text-muted-foreground">
              صفحة {page + 1} من {Math.ceil(total / 100)}
            </span>
            <button
              disabled={(page + 1) * 100 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm disabled:opacity-50 hover:bg-secondary/80 transition-colors"
            >
              التالي
            </button>
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
