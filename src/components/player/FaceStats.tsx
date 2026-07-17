import type { Player, PlayerStatGroup } from "@/types/player";

const overallFor = (title: string, p: Player) =>
  ({ Pace: p.pace, Shooting: p.shooting, Passing: p.passing,
     Dribbling: p.dribbling, Defending: p.defending, Physical: p.physical,
     Goalkeeping: p.pace } as Record<string, number>)[title] ?? 0;

const abbrev = (title: string) =>
  ({ Pace: "PAC", Shooting: "SHO", Passing: "PAS", Dribbling: "DRI",
     Defending: "DEF", Physical: "PHY", Goalkeeping: "GK" } as Record<string, string>)[title] ?? title.slice(0, 3).toUpperCase();

// EA FC26 in-game color ramp
const tone = (v: number) => {
  if (v >= 90) return "#00E37A";   // bright green
  if (v >= 80) return "#7BE04A";   // lime
  if (v >= 70) return "#F5D14B";   // gold
  if (v >= 60) return "#F19A3E";   // orange
  return "#E5533A";                // red
};

const StatLine = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
    <span className="text-[12px] text-white/70 font-medium tracking-wide uppercase">{label}</span>
    <span className="text-[14px] font-black tabular-nums" style={{ color: tone(value), textShadow: `0 0 8px ${tone(value)}55` }}>
      {value}
    </span>
  </div>
);

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <div
    className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
    style={{
      background:
        "linear-gradient(180deg, rgba(15,20,15,0.95) 0%, rgba(5,10,8,0.98) 100%)",
    }}
  >
    {/* Top header like EA in-game panel */}
    <div
      className="flex items-center justify-between px-5 py-3 border-b border-white/10"
      style={{ background: "linear-gradient(90deg, rgba(0,227,122,0.12), transparent)" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00E37A", boxShadow: "0 0 12px #00E37A" }} />
        <span className="text-[11px] font-black tracking-[0.35em] text-white/90 uppercase">In-Game Attributes</span>
      </div>
      <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">EA SPORTS FC 26</span>
    </div>

    <div className="grid md:grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-white/[0.06] [&>*]:border-white/[0.06]">
      {groups.map((g) => {
        const overall = overallFor(g.title, player);
        const color = tone(overall);
        return (
          <div key={g.title} className="p-5 relative group hover:bg-white/[0.02] transition-colors">
            {/* Section header — big number left, label right (FC26 style) */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-5xl font-black tabular-nums leading-none"
                  style={{ color, textShadow: `0 0 24px ${color}66` }}
                >
                  {overall}
                </span>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-black tracking-[0.3em] text-white/50 uppercase">
                  {abbrev(g.title)}
                </div>
                <div className="text-[13px] font-bold text-white/90 uppercase tracking-wider">
                  {g.title}
                </div>
              </div>
            </div>

            {/* Sub-stats */}
            <div className="flex flex-col">
              {g.stats.map((s) => (
                <StatLine key={s.key} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default FaceStats;
