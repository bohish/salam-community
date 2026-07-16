import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Trophy, Users, Globe2, Shield, Sparkles, ArrowLeft, GitCompare, BarChart3 } from "lucide-react";
import { useTopRanked, useRandomBatch } from "@/hooks/useFc26";
import { useAllPromos } from "@/hooks/useFutgg";
import PlayerCard from "@/components/PlayerCard";
import PlayerListRow from "@/components/PlayerListRow";
import SearchSuggestions from "@/components/SearchSuggestions";
import { PlayerCardSkeleton, PlayerRowSkeleton } from "@/components/Skeleton";

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link to={to} className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 hover:glass-strong transition-fluid">
    <Icon className="w-5 h-5 text-primary" />
    <span className="text-[11px] font-semibold">{label}</span>
  </Link>
);

const Section = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section className="mb-8">
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-lg font-black">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Row = ({ players }: { players: any[] }) => (
  <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4">
    {players.map((p) => (
      <div key={p.id} className="w-40 shrink-0 snap-start">
        <PlayerCard player={p} size="sm" />
      </div>
    ))}
  </div>
);

const HomePage = () => {
  const top = useTopRanked(24);
  const random = useRandomBatch(12, "featured");

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Helmet>
        <title>FUTHUB — قاعدة بيانات EA SPORTS FC 26</title>
        <meta name="description" content="اكتشف لاعبي EA SPORTS FC 26 بالتفاصيل الكاملة، الإحصائيات، الفلاتر المتقدمة، والمقارنات." />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-hero rounded-3xl p-5 mb-6 border border-border/60 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">FC 26 · محدث</span>
        </div>
        <h1 className="text-2xl font-black mb-1">قاعدة بيانات لاعبي FC 26</h1>
        <p className="text-sm text-muted-foreground mb-4">إحصائيات كاملة، ستايلات اللعب، مقارنات وفلاتر متقدمة.</p>
        <SearchSuggestions variant="hero" placeholder="ابحث باسم اللاعب أو ID..." />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-8">
        <QuickLink to="/events" icon={Sparkles} label="الأحداث" />
        <QuickLink to="/players" icon={Users} label="استكشاف" />
        <QuickLink to="/stats" icon={BarChart3} label="إحصائيات" />
        <QuickLink to="/compare" icon={GitCompare} label="مقارنة" />
        <QuickLink to="/clubs" icon={Shield} label="الأندية" />
        <QuickLink to="/leagues" icon={Trophy} label="الدوريات" />
        <QuickLink to="/nations" icon={Globe2} label="المنتخبات" />
        <QuickLink to="/favorites" icon={Users} label="المفضلة" />
      </div>

      <Section title="لاعبون مميزون">
        {random.isLoading && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="w-40 shrink-0"><PlayerCardSkeleton /></div>)}
          </div>
        )}
        {random.error && <p className="text-sm text-destructive">تعذّر تحميل البيانات.</p>}
        {random.data && <Row players={random.data} />}
      </Section>

      <Section
        title="أعلى تقييماً"
        action={<Link to="/players" className="text-xs text-primary flex items-center gap-1">عرض الكل <ArrowLeft className="w-3 h-3" /></Link>}
      >
        {top.isLoading && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="w-40 shrink-0"><PlayerCardSkeleton /></div>)}
          </div>
        )}
        {top.data && <Row players={top.data.slice(0, 12)} />}
      </Section>

      <Section
        title="الأكثر شعبية"
        action={<Link to="/stats" className="text-xs text-primary flex items-center gap-1">التصنيفات <ArrowLeft className="w-3 h-3" /></Link>}
      >
        {top.isLoading && <div className="grid gap-2">{Array.from({ length: 6 }).map((_, i) => <PlayerRowSkeleton key={i} />)}</div>}
        {top.data && (
          <div className="grid gap-2">
            {top.data.slice(12, 24).map((p) => <PlayerListRow key={p.id} player={p} />)}
          </div>
        )}
      </Section>
    </div>
  );
};

export default HomePage;
