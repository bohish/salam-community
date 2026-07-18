import type { Player } from "@/types/player";

const seedRand = (seed: number) => {
  let s = seed % 2147483647;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
};

const Cell = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="p-3 border border-border/50 rounded-md bg-background/40">
    <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-1 text-[18px] font-semibold tabular-nums text-foreground">{value}</p>
    {sub && <p className="text-[10.5px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const GameStats = ({ player }: { player: Player }) => {
  const rand = seedRand(player.id + player.rating);
  const matches = 20 + Math.floor(rand() * 180);
  const goals = Math.round(matches * (player.shooting / 220) + rand() * 5);
  const assists = Math.round(matches * (player.passing / 260) + rand() * 3);
  const avg = ((player.rating - 40) / 10).toFixed(2);

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="h-px bg-primary/40" />
      <div className="p-4">
        <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3">Match Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Cell label="مباريات" value={matches} sub="Weekend League" />
          <Cell label="أهداف" value={goals} sub={`${(goals / matches).toFixed(2)}/م`} />
          <Cell label="حاسمة" value={assists} sub={`${(assists / matches).toFixed(2)}/م`} />
          <Cell label="التقييم" value={avg} sub="متوسط" />
        </div>
      </div>
    </div>
  );
};

export default GameStats;
