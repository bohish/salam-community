import { useRef, useState } from "react";
import { X, Upload, Loader2, Image as ImageIcon, Check, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fileToResizedDataUrl, squadAnalyzerApi, type DetectedSlot, type DetectResponse } from "@/services/squadAnalyzer";
import { getFormation, FORMATIONS } from "@/lib/formations";
import type { Squad, SquadPlayer, SquadSlotState } from "@/types/squad";

type Stage = "idle" | "uploading" | "detecting" | "confirming" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  onSquadReady: (squad: Squad, budget: number | undefined) => void;
}

const AnalyzeSheet = ({ open, onClose, onSquadReady }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>("");
  const [formationHint, setFormationHint] = useState<string>("");
  const [stage, setStage] = useState<Stage>("idle");
  const [detection, setDetection] = useState<DetectResponse | null>(null);
  const [picks, setPicks] = useState<Record<number, SquadPlayer | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast.error("الرجاء اختيار صورة.");
    if (f.size > 8 * 1024 * 1024) return toast.error("حجم الصورة كبير جداً (الحد 8MB).");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null); setPreview(null); setBudget(""); setFormationHint("");
    setStage("idle"); setDetection(null); setPicks({});
  };

  const runDetect = async () => {
    if (!file) return toast.error("أضف صورة أولاً.");
    setStage("uploading");
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setStage("detecting");
      const res = await squadAnalyzerApi.detect(dataUrl, formationHint || undefined);
      if (!res.slots.length) {
        toast.error("لم يتم التعرف على أي لاعب في الصورة.");
        setStage("idle");
        return;
      }
      const initialPicks: Record<number, SquadPlayer | null> = {};
      res.slots.forEach((s) => { initialPicks[s.slotIndex] = s.autoSelected ?? null; });
      setDetection(res);
      setPicks(initialPicks);
      setStage("confirming");
    } catch (e: any) {
      toast.error(e.message || "فشل التحليل.");
      setStage("idle");
    }
  };

  const confirmAndLoad = () => {
    if (!detection) return;
    // Map detected slots (ordered by pitch position) onto the closest matching formation layout.
    const detectedFormation = detection.formation && FORMATIONS.some((f) => f.id === detection.formation)
      ? detection.formation
      : bestGuessFormation(detection.slots.map((s) => s.position ?? "").filter(Boolean));
    const layout = getFormation(detectedFormation).slots;

    // Group formation slots by position, then assign detected players by position in order.
    const remaining = layout.map((s) => ({ ...s }));
    const filledSlots: SquadSlotState[] = layout.map((s) => ({ ...s, player: null }));

    detection.slots.forEach((det) => {
      const player = picks[det.slotIndex];
      if (!player) return;
      // find first remaining layout slot with same position
      let target = remaining.find((r) => r.position === (det.position ?? player.position));
      if (!target) target = remaining.find((r) => r.position === player.position);
      if (!target) target = remaining[0];
      if (!target) return;
      const idx = filledSlots.findIndex((s) => s.id === target!.id);
      if (idx >= 0 && !filledSlots[idx].player) {
        filledSlots[idx] = { ...filledSlots[idx], player };
      }
      remaining.splice(remaining.indexOf(target), 1);
    });

    const squad: Squad = { formation: detectedFormation, slots: filledSlots };
    const budgetNum = budget ? Number(budget.replace(/[^\d]/g, "")) : undefined;
    onSquadReady(squad, budgetNum && Number.isFinite(budgetNum) ? budgetNum : undefined);
    toast.success("تم بناء التشكيلة من الصورة");
    reset(); onClose();
  };

  const isBusy = stage === "uploading" || stage === "detecting";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        dir="rtl"
        className="w-full sm:max-w-2xl max-h-[92vh] bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elegant)] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 border-b border-border/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm">حلّل تشكيلتي</p>
            <p className="text-[11px] text-muted-foreground">ارفع لقطة شاشة من EA FC أو FUTBIN أو Futmac</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted/60 grid place-items-center" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {stage !== "confirming" && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/60 bg-muted/20 grid place-items-center overflow-hidden transition-fluid"
              >
                {preview ? (
                  <img src={preview} alt="Squad preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center px-4">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-primary/15 grid place-items-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-black">اضغط لاختيار صورة</p>
                    <p className="text-[11px] text-muted-foreground mt-1">PNG أو JPG • حد 8MB</p>
                  </div>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground mb-1 block">الميزانية (اختياري)</label>
                  <input
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="مثال: 500000"
                    className="w-full bg-background/70 rounded-xl border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground mb-1 block">التشكيلة (اختياري)</label>
                  <select
                    value={formationHint}
                    onChange={(e) => setFormationHint(e.target.value)}
                    className="w-full bg-background/70 rounded-xl border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">اكتشاف تلقائي</option>
                    {FORMATIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={runDetect}
                disabled={!file || isBusy}
                className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-black flex items-center justify-center gap-2 shadow-[var(--shadow-glow)] disabled:opacity-40"
              >
                {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> {stage === "uploading" ? "تجهيز الصورة…" : "تحليل اللاعبين…"}</>
                  : <><ImageIcon className="w-4 h-4" /> حلّل الصورة</>}
              </button>
            </>
          )}

          {stage === "confirming" && detection && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                تم اكتشاف <span className="text-primary font-black">{detection.slots.length}</span> لاعب.
                يرجى تأكيد المطابقات التي تحمل شارة تنبيه.
              </div>
              {detection.slots.map((slot) => (
                <SlotConfirmRow
                  key={slot.slotIndex}
                  slot={slot}
                  selected={picks[slot.slotIndex]?.id ?? null}
                  onPick={(p) => setPicks((prev) => ({ ...prev, [slot.slotIndex]: p }))}
                />
              ))}
            </div>
          )}
        </div>

        {stage === "confirming" && (
          <div className="p-3 border-t border-border/60 bg-background/40 flex gap-2">
            <button
              onClick={() => { setStage("idle"); setDetection(null); }}
              className="px-4 py-2.5 rounded-xl bg-card/60 border border-border/60 text-xs font-black"
            >رجوع</button>
            <button
              onClick={confirmAndLoad}
              className="flex-1 h-11 rounded-xl bg-gradient-primary text-primary-foreground font-black shadow-[var(--shadow-glow)] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> تحميل التشكيلة إلى الملعب
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function SlotConfirmRow({
  slot, selected, onPick,
}: {
  slot: DetectedSlot;
  selected: number | null;
  onPick: (p: SquadPlayer | null) => void;
}) {
  const top = slot.candidates[0];
  const needs = slot.needsConfirmation && !selected;
  return (
    <div className={`rounded-xl border p-2.5 ${needs ? "border-accent/60 bg-accent/5" : "border-border/60 bg-card/40"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black">
          {slot.position ?? "?"}
        </span>
        <span className="text-xs font-black flex-1 truncate">اكتُشف: {slot.detected.name}</span>
        {slot.detected.rating && (
          <span className="text-[10px] text-muted-foreground">تقييم ~{slot.detected.rating}</span>
        )}
        {needs && (
          <span className="flex items-center gap-1 text-[10px] font-black text-accent-foreground">
            <AlertCircle className="w-3 h-3" /> اختر
          </span>
        )}
      </div>
      {slot.candidates.length === 0 ? (
        <div className="text-[11px] text-muted-foreground py-2 text-center">
          لم يُعثر على مرشحين — سيُترك المركز فارغاً.
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onPick(null)}
            className={`shrink-0 px-2 py-1.5 rounded-lg text-[11px] font-black border transition-fluid ${
              selected == null ? "bg-muted/60 border-border" : "bg-card/40 border-border/60 text-muted-foreground"
            }`}
          >تخطّي</button>
          {slot.candidates.map((c) => {
            const active = selected === c.player.id;
            return (
              <button
                key={c.player.id}
                onClick={() => onPick(c.player)}
                className={`shrink-0 flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-fluid ${
                  active ? "bg-primary text-primary-foreground border-primary shadow" : "bg-card/40 border-border/60 hover:border-primary/50"
                }`}
              >
                {c.player.cardUrl && (
                  <img src={c.player.cardUrl} alt="" className="w-7 h-9 object-contain" loading="lazy" />
                )}
                <div className="text-right">
                  <div className="text-[11px] font-black leading-tight">{c.player.name}</div>
                  <div className={`text-[9px] leading-tight ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {c.player.rating} • {c.player.position} • {Math.round(c.matchConfidence * 100)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {selected === top?.player.id && !needs && (
        <div className="mt-1.5 text-[10px] text-primary flex items-center gap-1"><Check className="w-3 h-3" /> مطابقة عالية الثقة</div>
      )}
    </div>
  );
}

// Very rough formation guesser from detected positions when the model didn't provide one.
function bestGuessFormation(positions: string[]): string {
  const has = (p: string) => positions.includes(p);
  const count = (p: string) => positions.filter((x) => x === p).length;
  if (count("CB") >= 3) return count("ST") >= 2 ? "3-5-2" : "3-4-3";
  if (has("CAM") && count("CDM") >= 2) return "4-2-3-1";
  if (count("ST") >= 2) return "4-4-2";
  if (count("CAM") >= 2) return "4-3-2-1";
  return "4-3-3";
}

export default AnalyzeSheet;
