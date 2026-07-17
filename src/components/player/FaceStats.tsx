import type { Player, PlayerStatGroup } from "@/types/player";
import StatRing from "./StatRing";
import StatBar from "./StatBar";

const overallFor = (title: string, p: Player) =>
  ({ Pace: p.pace, Shooting: p.shooting, Passing: p.passing,
     Dribbling: p.dribbling, Defending: p.defending, Physical: p.physical } as Record<string, number>)[title] ?? 0;

const FaceStats = ({ player, groups }: { player: Player; groups: PlayerStatGroup[] }) => (
  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
    {groups.map((g, gi) => {
      const overall = overallFor(g.title, player);
      return (
        <div key={g.title} className="card-premium rounded-2xl p-4 group">
          <div className="flex items-center gap-4 mb-3">
            {overall > 0 && <StatRing value={overall} size={72} label={g.title.slice(0, 3).toUpperCase()} />}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">القسم</p>
              <p className="text-lg font-black">{g.title}</p>
              <p className="text-[10px] text-muted-foreground">{g.stats.length} صفة فرعية</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            {g.stats.map((s, i) => (
              <StatBar key={s.key} label={s.label} value={s.value} delay={gi * 40 + i * 40} compact />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

export default FaceStats;
