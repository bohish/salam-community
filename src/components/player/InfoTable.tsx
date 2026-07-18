import type { Player } from "@/types/player";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex items-center justify-between text-[12px] py-2.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground/95 truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
};

const InfoTable = ({ player }: { player: Player }) => (
  <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
    <div className="h-px bg-primary/40" />
    <div className="p-4">
      <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2">Player Info</h3>
      <Row label="العمر" value={player.age || null} />
      <Row label="الطول" value={player.height} />
      <Row label="الوزن" value={player.weight} />
      <Row label="القدم" value={player.preferredFoot} />
      <Row label="القدم الضعيفة" value={player.weakFoot ? `${player.weakFoot}★` : null} />
      <Row label="المهارات" value={player.skillMoves ? `${player.skillMoves}★` : null} />
      <Row label="المركز" value={player.position} />
      <Row label="المراكز البديلة" value={player.altPositions.length ? player.altPositions.join(" · ") : null} />
      <Row label="النادي" value={player.club} />
      <Row label="الدوري" value={player.league} />
      <Row label="المنتخب" value={player.nation} />
    </div>
  </div>
);

export default InfoTable;
