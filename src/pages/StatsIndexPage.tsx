import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Breadcrumbs from "@/components/Breadcrumbs";
import { STAT_CATEGORIES } from "./StatsPage";

const StatsIndexPage = () => (
  <div className="container mx-auto px-4 py-4 max-w-3xl">
    <Helmet>
      <title>الإحصائيات — futmac.com FC 26</title>
      <meta name="description" content="تصنيفات لاعبي EA FC 26: أسرع اللاعبين، أفضل المهاجمين، الممررين، المراوغين، المدافعين، والحراس." />
    </Helmet>

    <Breadcrumbs items={[{ label: "الإحصائيات" }]} />

    <h1 className="text-2xl font-black mb-1">الإحصائيات</h1>
    <p className="text-xs text-muted-foreground mb-4">أفضل اللاعبين حسب كل مهارة.</p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {STAT_CATEGORIES.map((c) => {
        const Icon = c.icon;
        return (
          <Link key={c.slug} to={`/stats/${c.slug}`}
            className="card-premium rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm">{c.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

export default StatsIndexPage;
