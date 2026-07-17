import type { Player } from "@/types/player";
import { Flag, Shield, Trophy } from "lucide-react";

const Node = ({ icon: Icon, label, value, tone }: any) => (
  <div className="relative flex flex-col items-center gap-1.5">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
      style={{
        background: `conic-gradient(hsl(var(--primary)) ${value * 120}deg, hsl(var(--muted) / 0.35) 0deg)`,
        boxShadow: `0 0 22px hsl(var(--primary) / 0.35)`,
      }}
    >
      <div className="absolute inset-1.5 rounded-xl bg-card border border-border/60 flex items-center justify-center">
        <Icon className="w-5 h-5" style={{ color: tone }} />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${i < value ? "bg-primary shadow-[0_0_6px_hsl(var(--primary))]" : "bg-muted"}`} />
      ))}
    </div>
  </div>
);

const ChemistryViz = ({ player }: { player: Player }) => (
  <div className="glass-strong rounded-2xl p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-black tracking-wider uppercase">الكيمياء</h3>
      <span className="rating-chip rating-chip-elite">3/3</span>
    </div>
    <div className="flex items-center justify-around">
      <Node icon={Shield} label="النادي" value={3} tone="hsl(var(--primary))" />
      <div className="h-px w-8 bg-gradient-to-r from-primary/60 to-accent/60" />
      <Node icon={Trophy} label="الدوري" value={3} tone="hsl(var(--accent))" />
      <div className="h-px w-8 bg-gradient-to-r from-accent/60 to-gold/60" />
      <Node icon={Flag} label="المنتخب" value={3} tone="hsl(var(--gold))" />
    </div>
    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
      <p className="text-[10px] text-muted-foreground truncate">{player.club}</p>
      <p className="text-[10px] text-muted-foreground truncate">{player.league}</p>
      <p className="text-[10px] text-muted-foreground truncate">{player.nation}</p>
    </div>
  </div>
);

export default ChemistryViz;
