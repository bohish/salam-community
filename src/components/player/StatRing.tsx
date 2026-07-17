import { useEffect, useState } from "react";

const tone = (v: number) =>
  v >= 90 ? "hsl(var(--primary-glow))"
  : v >= 80 ? "hsl(var(--primary))"
  : v >= 70 ? "hsl(var(--accent))"
  : v >= 55 ? "hsl(var(--gold))"
  : "hsl(var(--destructive))";

const StatRing = ({ value, size = 84, label }: { value: number; size?: number; label?: string }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPct(Math.min(100, value)), 30); return () => clearTimeout(t); }, [value]);
  const color = tone(value);
  const inner = size - 12;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="rounded-full flex items-center justify-center transition-all duration-[900ms] ease-out"
        style={{
          width: size, height: size,
          background: `conic-gradient(${color} ${pct * 3.6}deg, hsl(var(--muted) / 0.4) 0deg)`,
          boxShadow: `0 0 24px ${color}44, inset 0 0 12px hsl(0 0% 0% / 0.4)`,
        }}
      >
        <div
          className="rounded-full bg-card flex flex-col items-center justify-center border border-border/50"
          style={{ width: inner, height: inner }}
        >
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
          {label && <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatRing;
