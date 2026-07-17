import { useEffect, useState } from "react";
import type { Player, PlayerStatGroup } from "@/types/player";

const overallFor = (title: string, p: Player) =>
  ({ Pace: p.pace, Shooting: p.shooting, Passing: p.passing,
     Dribbling: p.dribbling, Defending: p.defending, Physical: p.physical,
     Goalkeeping: p.pace } as Record<string, number>)[title] ?? 0;

const abbrev = (title: string) =>
  ({ Pace: "PAC", Shooting: "SHO", Passing: "PAS", Dribbling: "DRI",
     Defending: "DEF", Physical: "PHY", Goalkeeping: "GK" } as Record<string, string>)[title] ?? title.slice(0, 3).toUpperCase();

// Royal Gold + burgundy palette
const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F0D06A";
const BURGUNDY = "#8B0000";
const CREAM = "#F5EEDC";

const tone = (v: number) => {
  if (v >= 88) return GOLD_BRIGHT;
  if (v >= 78) return GOLD;
  if (v >= 68) return "#C9A961";
  if (v >= 55) return "#A08252";
  return BURGUNDY;
};

// Circular gauge (SVG) — refined editorial gold
const Gauge = ({ value, size = 120 }: { value: number; size?: number }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(Math.min(100, value)), 60);
    return () => clearTimeout(t);
  }, [value]);
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const color = tone(value);
  const id = `g-${value}-${size}`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD_BRIGHT} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(212,175,55,0.10)" strokeWidth="4" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#${id})`} strokeWidth="4" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif-display text-3xl font-black tabular-nums leading-none" style={{ color, textShadow: `0 0 14px ${color}55` }}>
          {value}
        </span>
      </div>
    </div>
  );
};

// Mini gauge for sub-stats
const MiniGauge = ({ value }: { value: number }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(Math.min(100, value)), 80);
    return () => clearTimeout(t);
  }, [value]);
  const size = 44;
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const color = tone(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(212,175,55,0.08)" strokeWidth="2.5" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth="2.5" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
};

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <div className="relative">
    {/* Editorial magazine header */}
    <div className="flex items-end justify-between mb-6 pb-4 border-b-2" style={{ borderColor: GOLD }}>
      <div>
        <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-1" style={{ color: GOLD }}>
          Chapter I · Attributes
        </p>
        <h2 className="font-serif-display italic text-4xl leading-none" style={{ color: CREAM }}>
          The Numbers
        </h2>
      </div>
      <div className="text-right hidden md:block">
        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "rgba(245,238,220,0.5)" }}>
          EA SPORTS FC 26
        </p>
        <p className="font-serif-editorial italic text-lg" style={{ color: CREAM }}>
          In-Game Statistics
        </p>
      </div>
    </div>

    {/* Editorial grid — magazine columns with rules between */}
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-0 border border-white/5 rounded"
      style={{ background: "linear-gradient(180deg, rgba(26,20,16,0.6), rgba(10,10,10,0.85))" }}
    >
      {groups.map((g, gi) => {
        const overall = overallFor(g.title, player);
        return (
          <article
            key={g.title}
            className="p-6 relative"
            style={{
              borderRight: gi % 3 !== 2 ? "1px solid rgba(212,175,55,0.10)" : undefined,
              borderBottom: "1px solid rgba(212,175,55,0.10)",
            }}
          >
            {/* Section header — editorial */}
            <header className="flex items-center gap-4 mb-5">
              <Gauge value={overall} size={96} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black tracking-[0.4em] uppercase" style={{ color: GOLD }}>
                  {abbrev(g.title)}
                </p>
                <h3 className="font-serif-display italic text-2xl leading-tight" style={{ color: CREAM }}>
                  {g.title}
                </h3>
                <div className="mt-1.5 h-px w-10" style={{ background: GOLD }} />
                <p className="text-[10px] mt-1.5 tracking-widest uppercase" style={{ color: "rgba(245,238,220,0.45)" }}>
                  {g.stats.length} traits
                </p>
              </div>
            </header>

            {/* Sub-stats — editorial list with mini gauges */}
            <ul className="space-y-2.5">
              {g.stats.map((s) => (
                <li key={s.key} className="flex items-center gap-3">
                  <MiniGauge value={s.value} />
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2 border-b border-dotted pb-1.5"
                    style={{ borderColor: "rgba(212,175,55,0.15)" }}
                  >
                    <span className="font-serif-editorial text-[15px] italic" style={{ color: CREAM }}>
                      {s.label}
                    </span>
                    <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(245,238,220,0.4)" }}>
                      {s.value >= 90 ? "Elite" : s.value >= 80 ? "Excellent" : s.value >= 70 ? "Strong" : s.value >= 60 ? "Solid" : "Fair"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  </div>
);

export default FaceStats;
