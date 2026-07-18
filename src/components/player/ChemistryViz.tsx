import type { Player } from "@/types/player";

const Node = ({ label, entity, value }: { label: string; entity: string; value: number }) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="font-mono-num text-[12px] font-semibold tabular-nums text-foreground/90">{value}/3</span>
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    </div>
    <div className="flex gap-1 mb-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-[3px] flex-1 rounded-full ${i < value ? "bg-primary/75" : "bg-muted/50"}`} />
      ))}
    </div>
    <p className="text-[11.5px] text-foreground/85 truncate">{entity || "—"}</p>
  </div>
);

const ChemistryViz = ({ player }: { player: Player }) => (
  <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
    <div className="h-px bg-primary/40" />
    <div className="p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Chemistry</h3>
        <span className="font-mono-num text-[13px] font-semibold text-foreground/90">3 / 3</span>
      </div>
      <div className="flex items-start gap-5">
        <Node label="Club" entity={player.club} value={3} />
        <div className="w-px self-stretch bg-border/60" />
        <Node label="League" entity={player.league} value={3} />
        <div className="w-px self-stretch bg-border/60" />
        <Node label="Nation" entity={player.nation} value={3} />
      </div>
    </div>
  </div>
);

export default ChemistryViz;
