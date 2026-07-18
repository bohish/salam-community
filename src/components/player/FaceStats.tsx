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

const toneClass = (v: number) => {
  if (v >= 90) return "text-emerald-500";
  if (v >= 80) return "text-green-500";
  if (v >= 70) return "text-lime-500";
  if (v >= 60) return "text-yellow-500";
  return "text-red-500";
};

const barClass = (v: number) => {
  if (v >= 90) return "bg-emerald-500";
  if (v >= 80) return "bg-green-500";
  if (v >= 70) return "bg-lime-500";
  if (v >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const SubStat = ({ label, value }: { label: string; value: number }) => (
  <div className="grid grid-cols-[1fr_2rem] items-center gap-2 py-1 text-[12px]">
    <span className="text-muted-foreground truncate">{label}</span>
    <span className={`font-mono-num font-semibold tabular-nums text-right ${toneClass(value)}`}>{value}</span>
  </div>
);

const CategoryBlock = ({
  title,
  value,
  stats,
}: {
  title: string;
  value: number;
  stats: { key: string; label: string; value: number }[];
}) => {
  const width = Math.min(100, Math.max(2, value));
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground/90">{title}</h3>
        <span className={`font-mono-num text-[16px] font-semibold tabular-nums ${toneClass(value)}`}>{value}</span>
      </div>
      <div className="h-[3px] w-full rounded-full bg-muted/40 overflow-hidden mb-2.5">
        <div className={`h-full rounded-full ${barClass(value)}`} style={{ width: `${width}%` }} />
      </div>
      <div className="divide-y divide-border/30">
        {stats.map((s) => (
          <SubStat key={s.key} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
};

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <section aria-label="Player attributes">
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Attributes</h2>
      <span className="text-[10.5px] text-muted-foreground/70">{groups.length} categories</span>
    </div>
    <div className="rounded-lg border border-border/60 bg-card/30 px-4 sm:px-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-border/30">
        {groups.map((g, i) => (
          <div
            key={g.title}
            className={`${i >= 2 ? "sm:border-t sm:border-border/30" : ""}`}
          >
            <CategoryBlock title={g.title} value={overallFor(g.title, player)} stats={g.stats} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FaceStats;
