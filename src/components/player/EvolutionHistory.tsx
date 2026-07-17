import { ArrowUpRight } from "lucide-react";
import type { Player } from "@/types/player";

// Deterministic mock evolution ladder until upstream Evolutions API is wired.
const buildLadder = (p: Player) => {
  const steps = [
    { name: "Base",      delta: -3, tag: "Gold",     tone: "hsl(var(--gold))" },
    { name: "Evo I",     delta: -2, tag: "+1 OVR",  tone: "hsl(var(--accent))" },
    { name: "Evo II",    delta: -1, tag: "+ PS",    tone: "hsl(var(--primary))" },
    { name: "Current",   delta:  0, tag: "الحالي",   tone: "hsl(var(--primary-glow))" },
  ];
  return steps.map((s) => ({ ...s, ovr: Math.max(60, p.rating + s.delta) }));
};

const EvolutionHistory = ({ player }: { player: Player }) => {
  const steps = buildLadder(player);
  return (
    <div className="glass-strong rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black tracking-wider uppercase">مسار التطوير</h3>
        <span className="text-[10px] text-muted-foreground">Evolutions</span>
      </div>
      <div className="grid grid-cols-4 gap-2 relative">
        <div className="absolute top-5 left-4 right-4 h-px bg-gradient-to-r from-gold via-primary to-primary-glow opacity-60" />
        {steps.map((s, i) => (
          <div key={s.name} className="relative flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black border-2 z-10"
              style={{ background: s.tone, color: "hsl(160 40% 5%)", borderColor: "hsl(var(--card))", boxShadow: `0 0 16px ${s.tone}66` }}
            >
              {s.ovr}
            </div>
            <p className="text-[10px] font-black text-center">{s.name}</p>
            <span className="text-[9px] font-bold text-muted-foreground inline-flex items-center gap-0.5">
              {i > 0 && <ArrowUpRight className="w-2.5 h-2.5 text-primary" />}
              {s.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvolutionHistory;
