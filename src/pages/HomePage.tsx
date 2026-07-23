import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Trophy, Users, Globe2, Shield, Sparkles, ArrowLeft, GitCompare, BarChart3 } from "lucide-react";
import { useTopRanked, useRandomBatch } from "@/hooks/useFc26";
import { useAllPromos } from "@/hooks/useFutgg";
import PlayerCard from "@/components/PlayerCard";
import PlayerListRow from "@/components/PlayerListRow";
import SearchSuggestions from "@/components/SearchSuggestions";
import RefreshButton from "@/components/RefreshButton";
import { PlayerCardSkeleton, PlayerRowSkeleton } from "@/components/Skeleton";

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link to={to} className="group glass rounded-2xl p-3.5 flex flex-col items-center gap-2 hover:glass-strong hover-lift transition-fluid">
    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-fluid">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-[11px] font-bold">{label}</span>
  </Link>
);

const Section = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4 px-1">
      <h2 className="section-title">{title}</h2>
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
  const { promos, isLoading: promosLoading } = useAllPromos(6);

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Helmet>
        <title>futmac.com — قاعدة بيانات EA SPORTS FC 26</title>
        <meta name="description" content="اكتشف لاعبي EA SPORTS FC 26 بالتفاصيل الكاملة، الإحصائيات، الفلاتر المتقدمة، والمقارنات." />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* Hero */}
      <div className="relative bg-gradient-hero rounded-[2rem] px-6 py-10 sm:py-14 mb-8 border border-border/60 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 animate-fade-in">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">FC 26 · تحديث مباشر</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-3 leading-tight animate-slide-up">
            قاعدة بيانات <span className="text-gradient-primary">EA SPORTS FC 26</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-7 max-w-lg mx-auto animate-slide-up">
            إحصائيات كاملة، ستايلات اللعب، أحداث حية، مقارنات دقيقة وفلاتر احترافية.
          </p>
          <div className="max-w-xl mx-auto animate-slide-up">
            <SearchSuggestions variant="hero" placeholder="ابحث باسم اللاعب أو ID..." />
          </div>
          <div className="flex items-center justify-center gap-6 mt-7 text-xs">
            <div><p className="text-lg font-black text-gradient-primary">17K+</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">لاعب</p></div>
            <div className="w-px h-8 bg-border/60" />
            <div><p className="text-lg font-black text-gradient-primary">Live</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">أحداث</p></div>
            <div className="w-px h-8 bg-border/60" />
            <div><p className="text-lg font-black text-gradient-primary">30+</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">فلتر</p></div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 mb-10">
        <QuickLink to="/events" icon={Sparkles} label="الأحداث" />
        <QuickLink to="/players" icon={Users} label="استكشاف" />
        <QuickLink to="/stats" icon={BarChart3} label="إحصائيات" />
        <QuickLink to="/compare" icon={GitCompare} label="مقارنة" />
        <QuickLink to="/clubs" icon={Shield} label="الأندية" />
        <QuickLink to="/leagues" icon={Trophy} label="الدوريات" />
        <QuickLink to="/nations" icon={Globe2} label="المنتخبات" />
        <QuickLink to="/favorites" icon={Users} label="المفضلة" />
      </div>

      <Section
        title="أحداث حية"
        action={
          <div className="flex items-center gap-3">
            <RefreshButton />
            <Link to="/events" className="text-xs text-primary flex items-center gap-1">عرض الكل <ArrowLeft className="w-3 h-3" /></Link>
          </div>
        }
      >
        {promosLoading && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-56 h-32 shrink-0 glass rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
        {promos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4">
            {promos.slice(0, 8).map((g) => (
              <Link
                key={g.slug}
                to={`/event/${g.slug}`}
                className="w-56 shrink-0 snap-start glass hover:glass-strong rounded-2xl p-3 transition-fluid"
              >
                <div className="flex gap-1 mb-2">
                  {g.preview.map((p) => {
                    const img = p.cardImageUrl || p.simpleCardImageUrl || p.imageUrl;
                    return (
                      <div key={p.id} className="flex-1 aspect-[3/4] rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                        {img && <img src={img} alt="" loading="lazy" className="w-full h-full object-contain" />}
                      </div>
                    );
                  })}
                </div>
                <p className="font-black text-xs truncate">{g.name}</p>
                <p className="text-[10px] text-muted-foreground">{g.count} لاعب · أعلى {g.topOverall}</p>
              </Link>
            ))}
          </div>
        )}
      </Section>

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
