import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const seedRand = (seed: number) => {
  let s = seed % 2147483647;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
};

const genSeries = (id: number, rating: number, days: number) => {
  const rand = seedRand(id * 7 + rating);
  const base = Math.round((rating - 60) * (rating - 60) * 40 + 500);
  const arr: { d: string; p: number }[] = [];
  let p = base;
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    p = Math.max(150, Math.round(p * (0.94 + rand() * 0.12)));
    const dt = new Date(now - i * 86_400_000);
    arr.push({ d: `${dt.getMonth() + 1}/${dt.getDate()}`, p });
  }
  return arr;
};

const formatCoin = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

const RANGES = [
  { key: "24h", label: "24س", days: 1 },
  { key: "7d", label: "7 أيام", days: 7 },
  { key: "30d", label: "30 يوم", days: 30 },
  { key: "90d", label: "90 يوم", days: 90 },
] as const;

const PriceTrend = ({ id, rating }: { id: number; rating: number }) => {
  const [range, setRange] = useState<typeof RANGES[number]>(RANGES[1]);
  const data = useMemo(() => genSeries(id, rating, range.days === 1 ? 24 : range.days), [id, rating, range]);
  const first = data[0]?.p ?? 0;
  const last = data[data.length - 1]?.p ?? 0;
  const delta = last - first;
  const pct = first ? (delta / first) * 100 : 0;
  const up = delta >= 0;

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="h-px bg-primary/40" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-1.5">Market Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-semibold tabular-nums text-foreground">{formatCoin(last)}</span>
              <span className={`text-[11px] font-semibold tabular-nums ${up ? "text-primary" : "text-destructive"}`}>
                {up ? "+" : ""}{pct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex gap-0.5 rounded-md border border-border/60 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors ${
                  range.key === r.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >{r.label}</button>
            ))}
          </div>
        </div>

        <div className="h-36">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="d" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCoin} width={40} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatCoin(v), "السعر"]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area type="monotone" dataKey="p" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#priceFill)" isAnimationActive animationDuration={600} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PriceTrend;
