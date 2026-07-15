import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Loader2, X } from "lucide-react";
import { usePlayerByName, usePlayerPool } from "@/hooks/useFc26";
import { playerSlug } from "@/lib/slug";
import type { Player } from "@/types/player";

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

interface Props {
  variant?: "hero" | "compact";
  autoFocus?: boolean;
  placeholder?: string;
}

const SearchSuggestions = ({ variant = "compact", autoFocus, placeholder }: Props) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(q, 250);
  const trimmed = debounced.trim();
  const isNumeric = /^\d+$/.test(trimmed);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const pool = usePlayerPool(150);
  const remote = usePlayerByName(!isNumeric && trimmed.length >= 3 ? trimmed : "");

  const suggestions = useMemo(() => {
    const list = pool.data ?? [];
    if (!trimmed) return list.slice(0, 8);
    const s = trimmed.toLowerCase();
    const local = list
      .filter((p) => p.name.toLowerCase().includes(s) || p.club.toLowerCase().includes(s))
      .slice(0, 8);
    if (remote.data && !local.find((p) => p.id === remote.data!.id)) {
      return [remote.data, ...local];
    }
    return local;
  }, [pool.data, remote.data, trimmed]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNumeric) { navigate(`/player/${trimmed}`); setOpen(false); return; }
    if (suggestions[0]) { go(suggestions[0]); return; }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  const go = (p: Player) => {
    navigate(`/player/${playerSlug(p.name, p.id)}`);
    setOpen(false);
    setQ("");
  };

  const heroInput = variant === "hero";

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={submit} className={`flex items-center gap-2 ${heroInput ? "glass-strong px-4 py-3 rounded-2xl" : "glass px-3 py-2 rounded-xl"}`}>
        <Search className="w-4 h-4 text-primary shrink-0" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          type="search"
          inputMode="search"
          placeholder={placeholder ?? "ابحث باسم اللاعب أو ID..."}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
        />
        {(pool.isLoading || remote.isFetching) && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="مسح" className="text-muted-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {open && (suggestions.length > 0 || trimmed) && (
        <div className="absolute top-full mt-2 inset-x-0 glass-strong rounded-2xl overflow-hidden z-50 animate-scale-in max-h-[70vh] overflow-y-auto">
          {suggestions.length === 0 && trimmed && (
            <p className="text-center text-xs text-muted-foreground py-6">لا توجد نتائج فورية. اضغط Enter للبحث الكامل.</p>
          )}
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(p)}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-primary/10 transition-fluid text-right"
            >
              <div className="w-9 h-12 shrink-0 flex items-center justify-center">
                {p.cardUrl && <img src={p.cardUrl} alt="" loading="lazy" className="w-full h-full object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{p.club} · {p.nation}</p>
              </div>
              <span className={`rating-chip ${p.rating >= 87 ? "rating-chip-elite" : ""}`}>{p.rating}</span>
            </button>
          ))}
          {trimmed && (
            <Link
              to={`/search?q=${encodeURIComponent(trimmed)}`}
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary py-2.5 border-t border-border/50 hover:bg-primary/5"
            >
              عرض كل نتائج "{trimmed}" ←
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
