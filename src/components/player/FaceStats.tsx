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

const StatRow = ({ label, value }: { label: string; value: number }) => {
  const width = Math.min(100, Math.max(2, value));
  return (
    <div className="flex items-center gap-3 py-[6px]">
      <span className="w-[120px] text-[11.5px] text-muted-foreground truncate">{label}</span>
      <div className="relative h-[3px] flex-1 rounded-full bg-muted/50 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary/75" style={{ width: `${width}%` }} />
      </div>
      <span className="font-mono-num text-[11.5px] font-semibold w-7 text-right tabular-nums text-foreground/90">
        {value}
      </span>
    </div>
  );
};

const GroupCard = ({
  title,
  value,
  stats,
}: {
  title: string;
  value: number;
  stats: { key: string; label: string; value: number }[];
}) => (
  <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
    <div className="h-px bg-primary/40" />
    <div className="p-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-[13px] font-semibold text-foreground/95 tracking-tight">{title}</h3>
        <span className="font-mono-num text-[17px] font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-[3px] rounded-full bg-muted/50 overflow-hidden mb-3">
        <div className="h-full rounded-full bg-primary/75" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <div className="grid grid-cols-1 gap-0 divide-y divide-border/30">
        {stats.map((s) => (
          <StatRow key={s.key} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  </div>
);

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <section aria-label="Player attributes">
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Attributes</h2>
      <span className="text-[10.5px] text-muted-foreground/70">{groups.length} categories</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {groups.map((g) => (
        <GroupCard key={g.title} title={g.title} value={overallFor(g.title, player)} stats={g.stats} />
      ))}
    </div>
  </section>
);

export default FaceStats;
