import { useEffect, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import type { SquadPlayer } from "@/types/squad";
import { squadBuilderApi } from "@/services/squadBuilder";

interface Props {
  open: boolean;
  slotId: string | null;
  position: string | null;
  excludeIds: number[];
  onPick: (p: SquadPlayer) => void;
  onClose: () => void;
}

const CandidateSheet = ({ open, slotId, position, excludeIds, onPick, onClose }: Props) => {
  const [items, setItems] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open || !position || !slotId) return;
    setLoading(true); setNote(null); setItems([]);
    squadBuilderApi.candidates(position, slotId, excludeIds)
      .then((r) => { setItems(r.candidates); if (r.note) setNote(r.note); })
      .catch((e) => setNote(e.message))
      .finally(() => setLoading(false));
  }, [open, position, slotId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const filtered = q.trim() ? items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-card border border-border/70 shadow-2xl overflow-hidden animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div>
            <h3 className="font-black text-base">اختر لاعباً لمركز {position}</h3>
            <p className="text-[11px] text-muted-foreground">{items.length} مرشح</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full hover:bg-muted" aria-label="إغلاق"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3 border-b border-border/60">
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم..." className="flex-1 bg-transparent outline-none text-sm" />
          </div>
        </div>
        <div className="p-3 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center gap-2 justify-center py-10 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل المرشحين...
            </div>
          )}
          {!loading && note && (
            <div className="text-center py-8 text-sm text-muted-foreground">{note}</div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPick(p)}
                  className="text-right rounded-xl border border-border/60 bg-background/60 hover:border-primary hover:bg-primary/5 transition-fluid p-2 flex gap-2 items-center"
                >
                  {p.cardUrl ? (
                    <img src={p.cardUrl} alt={p.name} className="w-12 h-16 object-contain shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-12 h-16 rounded bg-muted grid place-items-center text-lg font-black shrink-0">{p.rating}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black tabular-nums">{p.rating}</span>
                      <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-primary/15 text-primary">{p.position}</span>
                    </div>
                    <div className="text-xs font-bold truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.club ?? "-"}</div>
                    <div className="text-[10px] text-amber-400 font-bold">
                      {typeof p.price === "number" && p.price > 0 ? `${p.price.toLocaleString()} كوين` : "السعر غير متوفر"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateSheet;
