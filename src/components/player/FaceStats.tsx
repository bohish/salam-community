import type { Player, PlayerStatGroup } from "@/types/player";

const overallFor = (title: string, p: Player) =>
  ({ Pace: p.pace, Shooting: p.shooting, Passing: p.passing,
     Dribbling: p.dribbling, Defending: p.defending, Physical: p.physical,
     Goalkeeping: p.pace } as Record<string, number>)[title] ?? 0;

const abbrev = (title: string) =>
  ({ Pace: "PAC", Shooting: "SHO", Passing: "PAS", Dribbling: "DRI",
     Defending: "DEF", Physical: "PHY", Goalkeeping: "GK" } as Record<string, string>)[title] ?? title.slice(0, 3).toUpperCase();

// FUTMAC tone ramp — neon green → amber → red (readable on obsidian)
const toneHsl = (v: number) => {
  if (v >= 90) return "140 90% 58%";      // neon lime
  if (v >= 80) return "142 78% 48%";      // pitch green
  if (v >= 70) return "42 92% 55%";       // amber gold
  if (v >= 60) return "28 92% 55%";       // orange
  return "0 78% 55%";                     // red
};
const toneLabel = (v: number) =>
  v >= 90 ? "ELITE" : v >= 80 ? "EXCELLENT" : v >= 70 ? "STRONG" : v >= 60 ? "SOLID" : "WEAK";

/* Sub-stat bar row — compact, FUT.GG-inspired */
const StatRow = ({ label, value }: { label: string; value: number }) => {
  const c = toneHsl(value);
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="flex-1 text-[13px] text-foreground/85 truncate">{label}</span>
      <div className="flex items-center gap-2 w-[130px]">
        <div className="relative h-[6px] flex-1 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full animate-bar"
            style={{
              background: `linear-gradient(90deg, hsl(${c}), hsl(${c} / 0.75))`,
              boxShadow: `0 0 10px hsl(${c} / 0.4)`,
              ["--w" as string]: `${Math.min(100, value)}%`,
              width: `${Math.min(100, value)}%`,
            }}
          />
        </div>
        <span
          className="font-mono-num text-[13px] font-black w-8 text-right"
          style={{ color: `hsl(${c})` }}
        >
          {value}
        </span>
      </div>
    </li>
  );
};

/* Group tile — big number + label + substats list */
const GroupTile = ({ title, value, stats }: { title: string; value: number; stats: { key: string; label: string; value: number }[] }) => {
  const c = toneHsl(value);
  return (
    <article className="panel p-5 relative group hover:border-primary/40 transition-fluid">
      {/* Top bar with score */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div>
          <p className="eyebrow">{abbrev(title)}</p>
          <h3 className="font-display font-black text-[15px] mt-0.5 tracking-tight">{title}</h3>
        </div>
        <div className="text-right">
          <div
            className="font-mono-num text-[42px] leading-none font-black tracking-tighter"
            style={{ color: `hsl(${c})`, textShadow: `0 0 20px hsl(${c} / 0.35)` }}
          >
            {value}
          </div>
          <p className="text-[9px] tracking-[0.25em] font-black mt-0.5" style={{ color: `hsl(${c} / 0.75)` }}>
            {toneLabel(value)}
          </p>
        </div>
      </header>

      <ul>
        {stats.map((s) => <StatRow key={s.key} label={s.label} value={s.value} />)}
      </ul>
    </article>
  );
};

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
    {groups.map((g) => (
      <GroupTile key={g.title} title={g.title} value={overallFor(g.title, player)} stats={g.stats} />
    ))}
  </div>
);

export default FaceStats;
