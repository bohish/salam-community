import { useState } from "react";
import type { Player } from "@/types/player";

// Curated chemistry styles + their stat boosts (3-chem values).
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
    <div className="glass-strong rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black tracking-wider uppercase">أنماط الكيمياء</h3>
        <span className="text-[10px] text-muted-foreground">3 كيمياء</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
              active === s.key
                ? "bg-gradient-primary text-primary-foreground shadow-lg scale-105"
                : "glass hover:border-primary/40 text-foreground/80"
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
            <div key={k} className="glass rounded-xl p-2 text-center">
              <p className="text-[9px] font-black tracking-widest text-muted-foreground">{label}</p>
              <p className="text-lg font-black tabular-nums text-foreground">{total}</p>
              {boost > 0 && <p className="text-[9px] font-black text-primary">+{boost}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChemistryStyles;
