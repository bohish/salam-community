import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, Loader2, X } from "lucide-react";
import { usePlayerById, usePlayerByName, useTopRanked } from "@/hooks/useFc26";
import PlayerListRow from "@/components/PlayerListRow";

function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const SearchPage = () => {
  const [q, setQ] = useState("");
  const debounced = useDebounced(q, 400);
  const trimmed = debounced.trim();
  const isNumeric = /^\d+$/.test(trimmed);

  const nameQuery = usePlayerByName(isNumeric ? "" : trimmed);
  const idQuery = usePlayerById(isNumeric ? trimmed : null);
  const top = useTopRanked(30);

  const suggestions = useMemo(() => {
    if (!top.data) return [];
    if (!q.trim()) return top.data;
    const s = q.trim().toLowerCase();
    return top.data.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.club.toLowerCase().includes(s) ||
      p.nation.toLowerCase().includes(s)
    );
  }, [q, top.data]);

  const remotePlayer = isNumeric ? idQuery.data : nameQuery.data;
  const loading = (isNumeric ? idQuery.isFetching : nameQuery.isFetching) && trimmed.length >= 2;
  const showRemote = trimmed.length >= 2 && remotePlayer &&
    !suggestions.some(s => s.id === remotePlayer.id);

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl">
      <Helmet>
        <title>بحث اللاعبين — FUTHUB FC 26</title>
        <meta name="description" content="ابحث عن أي لاعب في EA SPORTS FC 26 بالاسم أو رقم ID." />
      </Helmet>

      <div className="glass-strong rounded-2xl flex items-center gap-2 px-4 py-3 mb-4 sticky top-2 z-20">
        <Search className="w-4 h-4 text-primary" />
        <input
          autoFocus
          type="search"
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="اسم اللاعب أو Player ID..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {q && !loading && (
          <button onClick={() => setQ("")} aria-label="مسح" className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Remote result banner */}
      {showRemote && remotePlayer && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 px-1">نتيجة مطابقة من قاعدة البيانات</p>
          <PlayerListRow player={remotePlayer} />
        </div>
      )}

      {trimmed.length >= 2 && !loading && !remotePlayer && suggestions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-16">لا توجد نتائج تطابق "{trimmed}".</p>
      )}

      <p className="text-xs text-muted-foreground mb-2 px-1">
        {q ? `${suggestions.length} نتيجة ضمن أعلى التقييمات` : "أعلى اللاعبين تقييماً"}
      </p>

      <div className="grid gap-2">
        {top.isLoading && Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-shimmer" />
        ))}
        {suggestions.map((p) => <PlayerListRow key={p.id} player={p} />)}
      </div>
    </div>
  );
};

export default SearchPage;
