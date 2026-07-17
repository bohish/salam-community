import type { Player } from "@/types/player";
import { Award, Flame, Star, Zap } from "lucide-react";

const seedRand = (seed: number) => {
  let s = seed % 2147483647;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
};

const Tile = ({ icon: Icon, label, value, sub }: any) => (
  <div className="glass rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
    <div className="w-10 h-10 rounded-xl bg-gradient-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-black tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const GameStats = ({ player }: { player: Player }) => {
  const rand = seedRand(player.id + player.rating);
  const matches = 20 + Math.floor(rand() * 180);
  const goals = Math.round(matches * (player.shooting / 220) + rand() * 5);
  const assists = Math.round(matches * (player.passing / 260) + rand() * 3);
  const avg = ((player.rating - 40) / 10).toFixed(2);
  const form = ["🔥🔥🔥🔥🔥", "🔥🔥🔥🔥·", "🔥🔥🔥··", "🔥🔥···"][player.rating % 4];

  return (
    <div className="glass-strong rounded-2xl p-4">
      <h3 className="text-sm font-black tracking-wider uppercase mb-3">إحصائيات المباريات</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Tile icon={Award} label="مباريات" value={matches} sub="Weekend League" />
        <Tile icon={Flame} label="أهداف"   value={goals}   sub={`${(goals / matches).toFixed(2)}/م`} />
        <Tile icon={Zap}   label="حاسمة"  value={assists} sub={`${(assists / matches).toFixed(2)}/م`} />
        <Tile icon={Star}  label="التقييم" value={avg}     sub={form} />
      </div>
    </div>
  );
};

export default GameStats;
