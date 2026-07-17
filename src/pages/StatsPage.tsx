import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePlayerPool } from "@/hooks/useFc26";
import PlayerListRow from "@/components/PlayerListRow";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PlayerRowSkeleton } from "@/components/Skeleton";
import { Zap, Target, Send, Sparkles, Shield, Hand } from "lucide-react";
import type { Player } from "@/types/player";

export interface StatCategory {
  slug: string;
  label: string;
  description: string;
  icon: any;
  sort: (a: Player, b: Player) => number;
  filter?: (p: Player) => boolean;
}

const num = (v: any) => parseInt(String(v ?? "0")) || 0;

export const STAT_CATEGORIES: StatCategory[] = [
  { slug: "fastest", label: "أسرع اللاعبين", description: "أعلى Pace في EA FC 26.",
    icon: Zap, sort: (a, b) => b.pace - a.pace, filter: (p) => !p.isGK },
  { slug: "best-shooters", label: "أفضل المهاجمين", description: "أعلى Shooting.",
    icon: Target, sort: (a, b) => b.shooting - a.shooting, filter: (p) => !p.isGK },
  { slug: "best-passers", label: "أفضل الممررين", description: "أعلى Passing.",
    icon: Send, sort: (a, b) => b.passing - a.passing, filter: (p) => !p.isGK },
  { slug: "best-dribblers", label: "أفضل المراوغين", description: "أعلى Dribbling.",
    icon: Sparkles, sort: (a, b) => b.dribbling - a.dribbling, filter: (p) => !p.isGK },
  { slug: "best-defenders", label: "أفضل المدافعين", description: "أعلى Defending.",
    icon: Shield, sort: (a, b) => b.defending - a.defending, filter: (p) => !p.isGK },
  { slug: "best-goalkeepers", label: "أفضل حراس المرمى", description: "أفضل الحراس تقييماً.",
    icon: Hand, sort: (a, b) => (num(b.raw["GK Reflexes"]) + num(b.raw["GK Diving"])) - (num(a.raw["GK Reflexes"]) + num(a.raw["GK Diving"])),
    filter: (p) => p.isGK },
];

const StatsPage = () => {
  const { slug = "" } = useParams();
  const category = STAT_CATEGORIES.find((c) => c.slug === slug);
  const pool = usePlayerPool(150);

  const list = useMemo(() => {
    if (!pool.data || !category) return [];
    const filtered = category.filter ? pool.data.filter(category.filter) : pool.data;
    return [...filtered].sort(category.sort).slice(0, 50);
  }, [pool.data, category]);

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-destructive">تصنيف غير موجود.</p>
        <Link to="/stats" className="text-primary text-sm mt-2 inline-block">العودة إلى الإحصائيات</Link>
      </div>
    );
  }

  const Icon = category.icon;

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl">
      <Helmet>
        <title>{category.label} — futmac.com FC 26</title>
        <meta name="description" content={`${category.description} قائمة أفضل 50 لاعباً.`} />
        <link rel="canonical" href={`/stats/${category.slug}`} />
      </Helmet>

      <Breadcrumbs items={[
        { label: "الإحصائيات", href: "/stats" },
        { label: category.label },
      ]} />

      <div className="card-premium rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black">{category.label}</h1>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <div className="grid gap-2">
        {pool.isLoading && Array.from({ length: 8 }).map((_, i) => <PlayerRowSkeleton key={i} />)}
        {list.map((p, i) => (
          <div key={p.id} className="relative">
            <span className="absolute -right-1 top-2 z-10 w-6 h-6 rounded-full glass-strong flex items-center justify-center text-[10px] font-black text-primary">
              {i + 1}
            </span>
            <PlayerListRow player={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPage;
