import { Zap, TrendingUp, Coins, UserMinus, Loader2, Lightbulb, ShieldCheck, AlertTriangle, Wand2 } from "lucide-react";
import type { AnalysisIntent, AnalysisResponse, SwapSuggestion } from "@/services/squadAnalyzer";

interface Props {
  analysis: AnalysisResponse;
  busy: AnalysisIntent | null;
  onAction: (intent: AnalysisIntent) => void;
  onApplySwaps: (swaps: SwapSuggestion[]) => void;
}

const AnalysisPanel = ({ analysis, busy, onAction, onApplySwaps }: Props) => {
  const a = analysis;
  return (
    <div className="mt-4 rounded-2xl border border-primary/25 bg-card/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-gradient-to-l from-primary/10 via-transparent to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <Wand2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm">تحليل مدرب futmac</p>
            <p className="text-[11px] text-muted-foreground truncate">{a.summary || "خلاصة تحليل التشكيلة"}</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-black">
            <Stat label="تقييم" value={a.stats.rating} />
            <Stat label="كيمياء" value={`${a.stats.chem}/33`} />
            <Stat label="سعر" value={a.stats.price.toLocaleString()} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ActionBtn onClick={() => onAction("chem")} busy={busy === "chem"} icon={<Zap className="w-4 h-4" />} label="تحسين الكيمياء" />
          <ActionBtn onClick={() => onAction("attack")} busy={busy === "attack"} icon={<TrendingUp className="w-4 h-4" />} label="ترقية الهجوم" />
          <ActionBtn onClick={() => onAction("weakest")} busy={busy === "weakest"} icon={<UserMinus className="w-4 h-4" />} label="استبدل الأضعف" />
          <ActionBtn onClick={() => onAction("budget")} busy={busy === "budget"} icon={<Coins className="w-4 h-4" />} label="ضمن الميزانية" />
        </div>

        {/* Strengths / Weaknesses */}
        <div className="grid sm:grid-cols-2 gap-3">
          <ListCard icon={<ShieldCheck className="w-4 h-4 text-primary" />} title="نقاط القوة" items={a.strengths} tone="primary" />
          <ListCard icon={<AlertTriangle className="w-4 h-4 text-accent" />} title="نقاط الضعف" items={a.weaknesses} tone="accent" />
        </div>

        {/* Chemistry */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-black">
              <Zap className="w-3.5 h-3.5 text-primary" /> الكيمياء
            </div>
            <div className="text-[11px] font-black text-primary">
              {a.chemistry?.current ?? 0} / {a.chemistry?.target ?? 33}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-primary transition-all"
              style={{ width: `${Math.min(100, Math.round(((a.chemistry?.current ?? 0) / (a.chemistry?.target || 33)) * 100))}%` }}
            />
          </div>
          {a.chemistry?.notes?.length > 0 && (
            <ul className="space-y-1 text-[11px] text-foreground/80">
              {a.chemistry.notes.map((n, i) => <li key={i} className="flex gap-1.5"><span className="text-primary">•</span>{n}</li>)}
            </ul>
          )}
        </div>

        {/* Tactics */}
        {a.tactics?.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs font-black mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-primary" /> نصائح تكتيكية
            </div>
            <ul className="space-y-1 text-xs text-foreground/85">
              {a.tactics.map((t, i) => <li key={i} className="flex gap-1.5"><span className="text-primary">•</span>{t}</li>)}
            </ul>
          </div>
        )}

        {/* Upgrades */}
        <SwapSection
          title="ترقيات مقترحة"
          icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
          swaps={a.upgrades}
          onApply={() => onApplySwaps(a.upgrades)}
        />

        {/* Cheaper alternatives */}
        <SwapSection
          title="بدائل أرخص"
          icon={<Coins className="w-3.5 h-3.5 text-primary" />}
          swaps={a.cheaperAlternatives}
          onApply={() => onApplySwaps(a.cheaperAlternatives)}
        />
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center">
    <div className="text-primary">{value}</div>
    <div className="text-[9px] text-muted-foreground font-bold">{label}</div>
  </div>
);

const ActionBtn = ({ onClick, busy, icon, label }: { onClick: () => void; busy?: boolean; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 px-2 py-2 text-[11px] font-black flex items-center justify-center gap-1.5 transition-fluid disabled:opacity-50"
  >
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
    <span className="truncate">{label}</span>
  </button>
);

const ListCard = ({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: "primary" | "accent" }) => (
  <div className={`rounded-xl border p-3 ${tone === "primary" ? "border-primary/25 bg-primary/5" : "border-accent/25 bg-accent/5"}`}>
    <div className="flex items-center gap-1.5 text-xs font-black mb-2">{icon}{title}</div>
    {items.length ? (
      <ul className="space-y-1 text-[11px] text-foreground/85">
        {items.map((t, i) => <li key={i} className="flex gap-1.5"><span className={tone === "primary" ? "text-primary" : "text-accent"}>•</span>{t}</li>)}
      </ul>
    ) : <p className="text-[11px] text-muted-foreground">لا يوجد.</p>}
  </div>
);

const SwapSection = ({
  title, icon, swaps, onApply,
}: { title: string; icon: React.ReactNode; swaps: SwapSuggestion[]; onApply: () => void }) => {
  if (!swaps?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-black">{icon}{title}</div>
        <button
          onClick={onApply}
          className="text-[10px] font-black px-2 py-1 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-fluid"
        >تطبيق الكل</button>
      </div>
      <ul className="space-y-2">
        {swaps.slice(0, 6).map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[11px]">
            {s.player.cardUrl && <img src={s.player.cardUrl} alt="" className="w-7 h-9 object-contain shrink-0" loading="lazy" />}
            <div className="flex-1 min-w-0">
              <div className="font-black truncate">{s.player.name} <span className="text-primary">{s.player.rating}</span></div>
              <div className="text-muted-foreground truncate">
                {s.player.position} • {s.player.club ?? "-"}
                {typeof s.player.price === "number" && ` • ${s.player.price.toLocaleString()} كوين`}
              </div>
              {s.reason && <div className="text-[10px] text-foreground/70 mt-0.5 line-clamp-2">{s.reason}</div>}
            </div>
            {typeof s.deltaRating === "number" && s.deltaRating !== 0 && (
              <span className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded ${s.deltaRating > 0 ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                {s.deltaRating > 0 ? `+${s.deltaRating}` : s.deltaRating}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnalysisPanel;
