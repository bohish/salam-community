import type { Player } from "@/types/player";

const buildLadder = (p: Player) => {
  const steps = [
    { name: "Base",    delta: -3, tag: "Gold" },
    { name: "Evo I",   delta: -2, tag: "+1 OVR" },
    { name: "Evo II",  delta: -1, tag: "+ PS" },
    { name: "Current", delta:  0, tag: "الحالي" },
  ];
  return steps.map((s) => ({ ...s, ovr: Math.max(60, p.rating + s.delta) }));
};

const EvolutionHistory = ({ player }: { player: Player }) => {
  const steps = buildLadder(player);
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="h-px bg-primary/40" />
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Evolution</h3>
          <span className="text-[10.5px] text-muted-foreground">مسار التطوير</span>
        </div>
        <div className="grid grid-cols-4 gap-2 relative">
          <div className="absolute top-[18px] left-6 right-6 h-px bg-border/60" />
          {steps.map((s, i) => {
            const current = i === steps.length - 1;
            return (
              <div key={s.name} className="relative flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums z-10 border ${
                    current
                      ? "bg-primary/15 border-primary/60 text-primary"
                      : "bg-background border-border/70 text-foreground/80"
                  }`}
                >
                  {s.ovr}
                </div>
                <p className="text-[11px] font-medium text-foreground/90">{s.name}</p>
                <span className="text-[10.5px] text-muted-foreground">{s.tag}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvolutionHistory;
