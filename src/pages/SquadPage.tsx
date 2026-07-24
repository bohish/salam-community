import { useMemo, useState } from "react";
import { Sparkles, Wand2, Coins, Zap, Repeat, Loader2, Send } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Pitch from "@/components/squad/Pitch";
import SquadHUD from "@/components/squad/SquadHUD";
import CandidateSheet from "@/components/squad/CandidateSheet";
import { FORMATIONS, getFormation } from "@/lib/formations";
import { computeChemistry, computeSquadRating, computeTotalPrice } from "@/lib/chemistry";
import { squadBuilderApi } from "@/services/squadBuilder";
import type { Squad, SquadPlayer, SquadSlotState } from "@/types/squad";
import { toast } from "sonner";

const emptySquad = (formationId: string): Squad => {
  const f = getFormation(formationId);
  return {
    formation: f.id,
    slots: f.slots.map((s) => ({ ...s, player: null })),
  };
};

const SquadPage = () => {
  const [squad, setSquad] = useState<Squad>(() => emptySquad("4-3-3"));
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<null | "build" | "cheaper" | "chem" | "formation" | "ai">(null);
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const chem = useMemo(() => computeChemistry(squad.slots), [squad]);
  const rating = useMemo(() => computeSquadRating(squad.slots.map((s) => s.player)), [squad]);
  const price = useMemo(() => computeTotalPrice(squad.slots.map((s) => s.player)), [squad]);
  const filled = squad.slots.filter((s) => s.player).length;

  const applyServerSquad = (server: Squad) => {
    // Merge server slots into the local formation layout to keep x/y coords.
    const layout = getFormation(server.formation).slots;
    const mapById = new Map(server.slots.map((s) => [s.id, s]));
    const merged: SquadSlotState[] = layout.map((s) => {
      const found = mapById.get(s.id);
      return { ...s, player: (found?.player as SquadPlayer | null) ?? null, reason: (found as any)?.reason };
    });
    setSquad({ formation: server.formation, slots: merged });
  };

  const doBuild = async (userPrompt?: string) => {
    setBusy(userPrompt ? "ai" : "build");
    try {
      const res = await squadBuilderApi.build(squad.formation, undefined, userPrompt, squad);
      applyServerSquad(res.squad);
      setReasoning(res.reasoning ?? []);
      toast.success("تم بناء التشكيلة");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const doCheaper = async () => {
    if (filled === 0) return toast.error("ابنِ التشكيلة أولاً.");
    setBusy("cheaper");
    try {
      const res = await squadBuilderApi.cheaper(squad, price.total ? Math.floor(price.total * 0.6) : undefined);
      applyServerSquad(res.squad);
      setReasoning(res.reasoning ?? []);
      toast.success("تم إنشاء نسخة أرخص");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const doImproveChem = async () => {
    if (filled === 0) return toast.error("ابنِ التشكيلة أولاً.");
    setBusy("chem");
    try {
      const res = await squadBuilderApi.improveChem(squad);
      applyServerSquad(res.squad);
      setReasoning(res.reasoning ?? []);
      toast.success("تم تحسين الكيمياء");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const changeFormation = async (id: string) => {
    if (filled === 0) { setSquad(emptySquad(id)); return; }
    setBusy("formation");
    try {
      const res = await squadBuilderApi.changeFormation(squad, id);
      applyServerSquad(res.squad);
      setReasoning(res.reasoning ?? []);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const handleSendPrompt = () => {
    const p = prompt.trim();
    if (!p) return;
    setPrompt("");
    doBuild(p);
  };

  const clearSlot = (id: string) =>
    setSquad((s) => ({ ...s, slots: s.slots.map((x) => (x.id === id ? { ...x, player: null } : x)) }));

  const pickPlayer = (p: SquadPlayer) => {
    if (!activeSlot) return;
    setSquad((s) => ({
      ...s,
      slots: s.slots.map((x) => (x.id === activeSlot ? { ...x, player: p } : x)),
    }));
    setActiveSlot(null);
  };

  const activeSlotDef = activeSlot ? squad.slots.find((s) => s.id === activeSlot) : null;
  const usedIds = squad.slots.map((s) => s.player?.id).filter(Boolean) as number[];

  return (
    <>
      <Helmet>
        <title>Squad Builder — بناء تشكيلات FC 26 | Futmac</title>
        <meta name="description" content="ابنِ تشكيلة FC 26 المثالية على الملعب مع كيمياء وسعر مباشر، وابنِ بالذكاء الاصطناعي بميزانيتك." />
      </Helmet>
      <div className="min-h-[calc(100vh-4rem)] px-3 pt-4 pb-32 max-w-5xl mx-auto" dir="rtl">
        <header className="mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
              <Wand2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-black">Squad Builder</h1>
              <p className="text-[11px] text-muted-foreground">ابنِ تشكيلتك يدوياً أو دع مدرب futmac يبنيها لك</p>
            </div>
          </div>
        </header>

        {/* Formation tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
          {FORMATIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => changeFormation(f.id)}
              disabled={busy === "formation"}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-black border transition-fluid ${
                squad.formation === f.id
                  ? "bg-primary text-primary-foreground border-primary shadow"
                  : "bg-card/60 border-border/60 text-foreground hover:border-primary/60"
              }`}
            >{f.label}</button>
          ))}
        </div>

        <SquadHUD rating={rating} chem={chem.team} totalPrice={price.total} missingPrices={price.missing} filled={filled} total={squad.slots.length} />

        <div className="my-4">
          <Pitch
            slots={squad.slots}
            chem={chem}
            onSlotClick={(id) => setActiveSlot(id)}
            onSlotClear={clearSlot}
            activeSlotId={activeSlot}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <ActionBtn onClick={() => doBuild()} busy={busy === "build"} icon={<Sparkles className="w-4 h-4" />} label="بناء AI" primary />
          <ActionBtn onClick={doCheaper} busy={busy === "cheaper"} icon={<Coins className="w-4 h-4" />} label="نسخة أرخص" />
          <ActionBtn onClick={doImproveChem} busy={busy === "chem"} icon={<Zap className="w-4 h-4" />} label="تحسين الكيمياء" />
        </div>

        {/* AI prompt */}
        <div className="rounded-2xl border border-primary/25 bg-card/60 p-3 mb-3">
          <label className="text-[11px] text-muted-foreground font-bold flex items-center gap-1.5 mb-2">
            <Wand2 className="w-3 h-3 text-primary" /> اطلب من المدرب أي شي: "ابنِ 4-3-3 برازيلي بميزانية 500 ألف"
          </label>
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="مثال: تشكيلة ريال مدريد بأعلى تقييم"
              className="flex-1 resize-none bg-background/70 rounded-xl border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendPrompt(); } }}
            />
            <button
              onClick={handleSendPrompt}
              disabled={busy === "ai" || !prompt.trim()}
              className="shrink-0 w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shadow disabled:opacity-40"
              aria-label="إرسال"
            >
              {busy === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Reasoning */}
        {reasoning.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-primary mb-2">
              <Repeat className="w-3 h-3" /> ملخص القرارات
            </div>
            <ul className="space-y-1 text-xs text-foreground/85">
              {reasoning.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary shrink-0">•</span><span>{r}</span></li>
              ))}
            </ul>
          </div>
        )}

        <CandidateSheet
          open={!!activeSlot}
          slotId={activeSlot}
          position={activeSlotDef?.position ?? null}
          excludeIds={usedIds}
          onPick={pickPlayer}
          onClose={() => setActiveSlot(null)}
        />
      </div>
    </>
  );
};

const ActionBtn = ({ onClick, busy, icon, label, primary }: { onClick: () => void; busy?: boolean; icon: React.ReactNode; label: string; primary?: boolean }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className={`rounded-xl border px-3 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-fluid ${
      primary
        ? "bg-gradient-primary text-primary-foreground border-primary/50 shadow-[var(--shadow-glow)]"
        : "bg-card/60 border-border/60 text-foreground hover:border-primary/60"
    } disabled:opacity-50`}
  >
    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {label}
  </button>
);

export default SquadPage;
