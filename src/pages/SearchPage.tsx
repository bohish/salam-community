import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import PlayerDetail from "@/components/PlayerDetail";
import type { Player } from "@/types/player";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Fetch a large batch to search from
  const { data, isLoading } = usePlayers({ limit: 100, offset: 0 });
  const players = data?.players || [];

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players.filter(
      p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.nation.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, players]);

  return (
    <div className="container mx-auto px-4 py-4" dir="rtl">
      {/* Search input */}
      <div className="relative mb-6">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن لاعب، نادي، أو جنسية..."
          className="w-full bg-card border border-border rounded-xl pr-10 pl-10 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!isLoading && query && results.length > 0 && (
        <div className="space-y-1">
          {results.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors text-right"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground/30">
                    {player.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{player.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{player.position}</span>
                  <span>•</span>
                  <span>{player.club}</span>
                  <span>•</span>
                  <span>{player.league}</span>
                </div>
              </div>
              <span className={`text-lg font-extrabold ${player.rating >= 86 ? "text-primary" : "text-gold"}`}>
                {player.rating}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && query && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-muted-foreground text-sm">ما لقينا نتائج لـ "{query}"</p>
        </div>
      )}

      {/* Empty state */}
      {!query && !isLoading && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-muted-foreground text-sm">ابحث عن أي لاعب في FC 25</p>
          <p className="text-muted-foreground text-xs mt-1">{data?.total?.toLocaleString() || 0} لاعب متوفر</p>
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
};

export default SearchPage;
