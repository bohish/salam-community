import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

// Deterministic mock price series until a real prices provider is wired.
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
    <div className="glass-strong rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">سعر السوق</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gradient-gold tabular-nums">{formatCoin(last)}</span>
            <span className={`text-xs font-black inline-flex items-center gap-1 ${up ? "text-primary" : "text-destructive"}`}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {pct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">تقديري · قريباً بيانات لحظية</p>
        </div>
        <div className="flex gap-1 glass rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                range.key === r.key ? "bg-gradient-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >{r.label}</button>
          ))}
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
            <XAxis dataKey="d" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCoin} width={40} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [formatCoin(v), "السعر"]}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            <Area type="monotone" dataKey="p" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#priceFill)" isAnimationActive animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceTrend;
