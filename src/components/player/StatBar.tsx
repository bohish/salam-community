import { useEffect, useState } from "react";

const tone = (v: number) =>
  v >= 90 ? "hsl(var(--primary-glow))"
  : v >= 80 ? "hsl(var(--primary))"
  : v >= 70 ? "hsl(var(--accent))"
  : v >= 55 ? "hsl(var(--gold))"
  : "hsl(var(--destructive))";

interface Props { label: string; value: number; delay?: number; compact?: boolean }

const StatBar = ({ label, value, delay = 0, compact }: Props) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(100, value)), 30 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className={compact ? "py-1" : "py-1.5"}>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-foreground/80 font-semibold tracking-wide">{label}</span>
        <span className="font-black tabular-nums text-xs" style={{ color: tone(value) }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{
            width: `${w}%`,
            background: `linear-gradient(90deg, ${tone(value)}, hsl(var(--primary-glow)))`,
            boxShadow: `0 0 12px ${tone(value)}55`,
          }}
        />
      </div>
    </div>
  );
};

export default StatBar;
