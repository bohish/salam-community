import { useState, useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import PlayerDetail from "@/components/PlayerDetail";
import type { Player } from "@/types/player";
import { ChevronLeft, ChevronRight, List, Grid } from "lucide-react";

const StatCell = ({ value }: { value: number }) => {
  const color = value >= 90 ? "text-accent" : value >= 75 ? "text-primary" : value >= 60 ? "text-foreground" : "text-destructive";
  return <td className={`px-2 py-2.5 text-center text-xs font-bold ${color}`}>{value}</td>;
};

const PlayersPage = () => {
  const [page, setPage] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data, isLoading } = usePlayers({ limit: 50, offset: page * 50 });

  const players = data?.players || [];
  const total = data?.total || 0;

  const filteredPlayers = useMemo(() => {
    let result = [...players];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q));
    }
    if (selectedPosition) result = result.filter(p => p.position === selectedPosition);
    return result;
  }, [players, searchQuery, selectedPosition]);

  const positions = useMemo(() => [...new Set(players.map(p => p.position))].sort(), [players]);

  return (
    <div className="container mx-auto px-2 py-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-extrabold text-lg text-foreground">EA FC 25 Players</h1>
          <p className="text-xs text-muted-foreground">UT Database & Ratings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="اسم اللاعب..."
          className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Position filter chips */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-4 pb-1">
        <button
          onClick={() => setSelectedPosition("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
            !selectedPosition ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
          }`}
        >
          الكل
        </button>
        {positions.map((pos) => (
          <button
            key={pos}
            onClick={() => setSelectedPosition(selectedPosition === pos ? "" : pos)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              selectedPosition === pos ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Table View */}
      {!isLoading && viewMode === "list" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">NAME</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground">RAT</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground">POS</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">PAC</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">SHO</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">PAS</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">DRI</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">DEF</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">PHY</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {player.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs truncate">{player.name}</p>
                          <div className="flex items-center gap-1">
                            {player.nationImage && (
                              <img src={player.nationImage} alt="" className="w-3 h-2.5 object-contain" loading="lazy" />
                            )}
                            {player.clubImage && (
                              <img src={player.clubImage} alt="" className="w-3 h-3 object-contain" loading="lazy" />
                            )}
                            <span className="text-[10px] text-muted-foreground truncate">{player.club}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
                        player.rating >= 86 ? "bg-primary/20 text-primary" : "bg-gold/20 text-gold"
                      }`}>
                        {player.rating}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-muted-foreground font-medium">
                      {player.position}
                    </td>
                    <StatCell value={player.pace} />
                    <StatCell value={player.shooting} />
                    <StatCell value={player.passing} />
                    <StatCell value={player.dribbling} />
                    <StatCell value={player.defending} />
                    <StatCell value={player.physical} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === "grid" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className="bg-card border border-border rounded-lg p-3 flex flex-col items-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary mb-2">
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground/30">
                    {player.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className={`text-sm font-extrabold ${player.rating >= 86 ? "text-primary" : "text-gold"}`}>
                {player.rating}
              </span>
              <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">
                {player.name.split(" ").pop()}
              </span>
              <span className="text-[9px] text-muted-foreground">{player.position}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredPlayers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">ما لقينا لاعبين 😔</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && total > 50 && (
        <div className="flex items-center justify-center gap-3 mt-6 mb-4">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="p-2 bg-card border border-border rounded-lg disabled:opacity-30 hover:bg-secondary transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            {page + 1} / {Math.ceil(total / 50)}
          </span>
          <button
            disabled={(page + 1) * 50 >= total}
            onClick={() => setPage(p => p + 1)}
            className="p-2 bg-card border border-border rounded-lg disabled:opacity-30 hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
};

export default PlayersPage;
