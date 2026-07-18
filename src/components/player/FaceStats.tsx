import type { Player, PlayerStatGroup } from "@/types/player";

const overallFor = (title: string, p: Player) =>
  ({
    Pace: p.pace,
    Shooting: p.shooting,
    Passing: p.passing,
    Dribbling: p.dribbling,
    Defending: p.defending,
    Physical: p.physical,
    Goalkeeping: p.pace,
  } as Record<string, number>)[title] ?? 0;

const StatRow = ({ label, value, delay }: { label: string; value: number; delay: number }) => {
  const width = Math.min(100, Math.max(2, value));
  return (
    <div className="flex items-center gap-3 py-[5px]" style={{ animation: `fadeIn 400ms ease-out ${delay}ms both` }}>
      <span className="w-[110px] text-[11px] text-muted-foreground truncate">{label}</span>
      <div className="relative h-[3px] flex-1 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/80"
          style={{ width: `${width}%`, animation: `barGrow 600ms ease-out ${delay}ms both` }}
        />
      </div>
      <span className="font-mono-num text-[11px] font-semibold w-6 text-right tabular-nums text-foreground/90">
        {value}
      </span>
    </div>
  );
};

const GroupCard = ({
  title,
  value,
  stats,
  index,
}: {
  title: string;
  value: number;
  stats: { key: string; label: string; value: number }[];
  index: number;
}) => {
  return (
    <div
      className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
      style={{ animation: `fadeIn 400ms ease-out ${index * 40}ms both` }}
    >
      <div className="h-[2px] bg-primary/35" />
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
          <span className="font-mono-num text-xl font-bold tabular-nums text-foreground">{value}</span>
        </div>

        <div className="h-1 rounded-full bg-muted/60 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-primary/70"
            style={{ width: `${Math.min(100, value)}%`, animation: `barGrow 700ms ease-out ${index * 40}ms both` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-0">
          {stats.map((s, i) => (
            <StatRow key={s.key} label={s.label} value={s.value} delay={index * 40 + i * 25} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <section aria-label="Player attributes">
    <style>{`
      @keyframes barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Attributes</h2>
      <span className="text-[10px] text-muted-foreground/70">{groups.length} categories</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {groups.map((g, i) => (
        <GroupCard
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
