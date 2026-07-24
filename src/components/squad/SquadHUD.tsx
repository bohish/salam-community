import { Coins, Gauge, Zap } from "lucide-react";

interface Props {
  rating: number;
  chem: number;
  totalPrice: number;
  missingPrices: number;
  filled: number;
  total: number;
}

const SquadHUD = ({ rating, chem, totalPrice, missingPrices, filled, total }: Props) => (
  <div className="grid grid-cols-3 gap-2">
    <Stat icon={<Gauge className="w-4 h-4" />} label="التقييم" value={rating || "-"} tone="text-primary" />
    <Stat icon={<Zap className="w-4 h-4" />} label="الكيمياء" value={`${chem}/33`} tone="text-emerald-400" />
    <Stat
      icon={<Coins className="w-4 h-4" />}
      label="السعر"
      value={totalPrice ? totalPrice.toLocaleString() : "-"}
      hint={missingPrices ? `+${missingPrices} بدون سعر` : `${filled}/${total} لاعب`}
      tone="text-amber-400"
    />
  </div>
);

const Stat = ({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string; tone: string }) => (
  <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur px-3 py-2">
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
      <span className={tone}>{icon}</span>
      {label}
    </div>
    <div className={`text-lg font-black tabular-nums ${tone}`}>{value}</div>
    {hint && <div className="text-[9px] text-muted-foreground">{hint}</div>}
  </div>
);

export default SquadHUD;
