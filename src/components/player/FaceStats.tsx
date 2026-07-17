import type { Player, PlayerStatGroup } from "@/types/player";
import { Zap, Target, Send, Sparkles, Shield, Dumbbell, HandMetal } from "lucide-react";

const META: Record<string, { abbr: string; icon: any; hue: string }> = {
  Pace:       { abbr: "PAC", icon: Zap,       hue: "142 78% 52%" },
  Shooting:   { abbr: "SHO", icon: Target,    hue: "18 92% 58%"  },
  Passing:    { abbr: "PAS", icon: Send,      hue: "195 92% 55%" },
  Dribbling:  { abbr: "DRI", icon: Sparkles,  hue: "280 78% 62%" },
  Defending:  { abbr: "DEF", icon: Shield,    hue: "210 88% 60%" },
  Physical:   { abbr: "PHY", icon: Dumbbell,  hue: "42 92% 55%"  },
  Goalkeeping:{ abbr: "GK",  icon: HandMetal, hue: "160 78% 52%" },
};

const overallFor = (title: string, p: Player) =>
  ({ Pace: p.pace, Shooting: p.shooting, Passing: p.passing,
     Dribbling: p.dribbling, Defending: p.defending, Physical: p.physical,
     Goalkeeping: p.pace } as Record<string, number>)[title] ?? 0;

// FUTMAC tone ramp (value → HSL). Neon green → lime → gold → orange → red.
const toneHsl = (v: number) => {
  if (v >= 90) return "140 92% 60%";
  if (v >= 85) return "142 82% 50%";
  if (v >= 80) return "88 82% 52%";
  if (v >= 75) return "58 92% 55%";
  if (v >= 70) return "42 94% 56%";
  if (v >= 60) return "28 92% 55%";
  if (v >= 50) return "14 88% 55%";
  return "0 82% 56%";
};
const toneLabel = (v: number) =>
  v >= 90 ? "ELITE" : v >= 85 ? "WORLD CLASS" : v >= 80 ? "EXCELLENT"
  : v >= 75 ? "STRONG" : v >= 70 ? "SOLID" : v >= 60 ? "AVERAGE" : "WEAK";

/* Sub-stat row — label + animated bar + value */
const StatRow = ({ label, value, delay }: { label: string; value: number; delay: number }) => {
  const c = toneHsl(value);
  const w = Math.min(100, Math.max(2, value));
  return (
    <li className="flex items-center gap-3 py-[7px]">
      <span className="flex-1 text-[12.5px] text-foreground/80 truncate font-medium">{label}</span>
      <div className="relative h-[5px] w-[92px] rounded-full bg-white/[0.05] overflow-hidden ring-1 ring-inset ring-white/[0.03]">
        <div
          className="absolute inset-y-0 left-0 rounded-full origin-left"
          style={{
            width: `${w}%`,
            background: `linear-gradient(90deg, hsl(${c} / 0.85), hsl(${c}))`,
            boxShadow: `0 0 8px hsl(${c} / 0.55)`,
            animation: `barGrow 800ms cubic-bezier(.2,.9,.25,1) ${delay}ms both`,
          }}
        />
      </div>
      <span
        className="font-mono-num text-[13px] font-black w-[26px] text-right tabular-nums"
        style={{ color: `hsl(${c})` }}
      >
        {value}
      </span>
    </li>
  );
};

/* Category card */
const GroupTile = ({ title, value, stats, index }: {
  title: string; value: number; stats: { key: string; label: string; value: number }[]; index: number;
}) => {
  const meta = META[title] ?? { abbr: title.slice(0, 3).toUpperCase(), icon: Zap, hue: "142 78% 50%" };
  const Icon = meta.icon;
  const c = toneHsl(value);

  return (
    <article
      className="group relative rounded-2xl overflow-hidden border border-border/60 bg-[hsl(var(--card))]/70 backdrop-blur-xl transition-fluid hover:border-primary/40 hover:-translate-y-0.5"
      style={{
        boxShadow: `inset 0 1px 0 hsl(0 0% 100% / 0.03), 0 12px 40px -12px hsl(${c} / 0.12)`,
        animation: `tileIn 500ms cubic-bezier(.2,.9,.25,1) ${index * 60}ms both`,
      }}
    >
      {/* Accent glow */}
      <div
        aria-hidden
        className="absolute -top-24 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(closest-side, hsl(${c} / 0.22), transparent 70%)` }}
      />
      {/* Top gradient hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, hsl(${c} / 0.7), transparent)` }}
      />

      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(${c} / 0.18), hsl(${c} / 0.06))`,
              boxShadow: `inset 0 0 0 1px hsl(${c} / 0.25)`,
              color: `hsl(${c})`,
            }}
          >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="text-[9.5px] tracking-[0.28em] font-black text-muted-foreground/80 leading-none">
              {meta.abbr}
            </p>
            <h3 className="font-display font-black text-[15px] mt-1 leading-none tracking-tight">
              {title}
            </h3>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className="font-mono-num text-[44px] leading-[0.85] font-black tracking-tighter tabular-nums"
            style={{ color: `hsl(${c})`, textShadow: `0 0 24px hsl(${c} / 0.4)` }}
          >
            {value}
          </div>
          <p
            className="text-[8.5px] tracking-[0.25em] font-black mt-1"
            style={{ color: `hsl(${c} / 0.85)` }}
          >
            {toneLabel(value)}
          </p>
        </div>
      </header>

      {/* Overall bar */}
      <div className="px-4">
        <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full origin-left"
            style={{
              width: `${Math.min(100, value)}%`,
              background: `linear-gradient(90deg, hsl(${c} / 0.6), hsl(${c}))`,
              boxShadow: `0 0 12px hsl(${c} / 0.6)`,
              animation: `barGrow 900ms cubic-bezier(.2,.9,.25,1) ${index * 60 + 120}ms both`,
            }}
          />
        </div>
      </div>

      <ul className="px-4 pb-4 pt-2 divide-y divide-border/40">
        {stats.map((s, i) => (
          <StatRow key={s.key} label={s.label} value={s.value} delay={index * 60 + 180 + i * 40} />
        ))}
      </ul>
    </article>
  );
};

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <section aria-label="Player attributes">
    <style>{`
      @keyframes barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes tileIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {groups.map((g, i) => (
        <GroupTile
          key={g.title}
          index={i}
          title={g.title}
          value={overallFor(g.title, player)}
          stats={g.stats}
        />
      ))}
    </div>
  </section>
);

export default FaceStats;
