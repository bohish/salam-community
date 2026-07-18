import { useState } from "react";
import type { Player } from "@/types/player";

const STYLES = [
  { key: "Basic",     boosts: { pace: 3, shooting: 3, passing: 3, dribbling: 3, defending: 3, physical: 3 } },
  { key: "Sniper",    boosts: { shooting: 6, dribbling: 6 } },
  { key: "Finisher",  boosts: { shooting: 6, physical: 6 } },
  { key: "Deadeye",   boosts: { shooting: 6, passing: 6 } },
  { key: "Marksman",  boosts: { shooting: 4, dribbling: 4, physical: 4 } },
  { key: "Hawk",      boosts: { pace: 6, shooting: 4, physical: 4 } },
  { key: "Artist",    boosts: { passing: 6, dribbling: 6 } },
  { key: "Architect", boosts: { passing: 6, physical: 6 } },
  { key: "Powerhouse",boosts: { passing: 6, defending: 6 } },
  { key: "Maestro",   boosts: { shooting: 4, passing: 4, dribbling: 4 } },
  { key: "Engine",    boosts: { pace: 4, passing: 4, dribbling: 4 } },
  { key: "Sentinel",  boosts: { defending: 6, physical: 6 } },
  { key: "Guardian",  boosts: { passing: 4, defending: 4, dribbling: 4 } },
  { key: "Gladiator", boosts: { shooting: 6, defending: 6 } },
  { key: "Backbone",  boosts: { passing: 4, defending: 4, physical: 4 } },
  { key: "Anchor",    boosts: { pace: 4, defending: 4, physical: 4 } },
  { key: "Hunter",    boosts: { pace: 6, shooting: 6 } },
  { key: "Catalyst",  boosts: { pace: 6, passing: 6 } },
  { key: "Shadow",    boosts: { pace: 6, defending: 6 } },
] as const;

const cap = (v: number) => Math.min(99, v);

type Key = "pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical";
const KEYS: { k: Key; label: string }[] = [
  { k: "pace", label: "PAC" }, { k: "shooting", label: "SHO" }, { k: "passing", label: "PAS" },
  { k: "dribbling", label: "DRI" }, { k: "defending", label: "DEF" }, { k: "physical", label: "PHY" },
];

const ChemistryStyles = ({ player }: { player: Player }) => {
  const [active, setActive] = useState<string>("Basic");
  if (player.isGK) return null;
  const boosts = STYLES.find((s) => s.key === active)?.boosts as Partial<Record<Key, number>>;

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="h-px bg-primary/40" />
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Chemistry Styles</h3>
          <span className="text-[10.5px] text-muted-foreground">3 chem</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`px-2 py-1 rounded text-[10.5px] font-medium border transition-colors ${
                active === s.key
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >{s.key}</button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {KEYS.map(({ k, label }) => {
            const base = player[k];
            const boost = boosts?.[k] ?? 0;
            const total = cap(base + boost);
            return (
              <div key={k} className="p-2 text-center border border-border/50 rounded-md bg-background/40">
                <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground">{label}</p>
                <p className="text-[15px] font-semibold tabular-nums text-foreground mt-0.5">{total}</p>
                {boost > 0 && <p className="text-[10px] font-medium text-primary">+{boost}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChemistryStyles;
