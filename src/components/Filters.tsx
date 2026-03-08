import { Filter, X } from "lucide-react";
import { useState } from "react";

interface FiltersProps {
  selectedPosition: string;
  onPositionChange: (pos: string) => void;
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
  selectedCardType: string;
  onCardTypeChange: (type: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  leagues?: string[];
  positions?: string[];
}

const Filters = ({
  selectedPosition, onPositionChange,
  selectedLeague, onLeagueChange,
  sortBy, onSortChange,
  leagues = [],
  positions = [],
}: FiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = selectedPosition || selectedLeague;

  const clearAll = () => {
    onPositionChange("");
    onLeagueChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter size={16} />
          الفلاتر
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-gold" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80">
              <X size={12} /> مسح الكل
            </button>
          )}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-secondary text-foreground text-xs rounded-md px-3 py-1.5 border border-border focus:outline-none focus:border-primary"
          >
            <option value="rating">التقييم</option>
            <option value="name">الاسم</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
          {/* Position */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">المركز</label>
            <div className="flex flex-wrap gap-1">
              {positions.slice(0, 10).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onPositionChange(selectedPosition === pos ? "" : pos)}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    selectedPosition === pos
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* League */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">الدوري</label>
            <select
              value={selectedLeague}
              onChange={(e) => onLeagueChange(e.target.value)}
              className="w-full bg-secondary text-foreground text-xs rounded-md px-3 py-1.5 border border-border focus:outline-none focus:border-primary"
            >
              <option value="">الكل</option>
              {leagues.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
