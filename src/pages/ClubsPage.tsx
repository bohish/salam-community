import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Shield } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TOP_CLUBS } from "@/data/catalog";
import { entitySlug } from "@/lib/slug";

const ClubsPage = () => (
  <div className="container mx-auto px-4 py-4 max-w-3xl">
    <Helmet>
      <title>الأندية — FUTHUB FC 26</title>
      <meta name="description" content="تصفح أشهر أندية FC 26 وقائمة لاعبي كل نادي." />
      <link rel="canonical" href="/clubs" />
    </Helmet>

    <Breadcrumbs items={[{ label: "الأندية" }]} />

    <h1 className="text-2xl font-black mb-4">الأندية</h1>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {TOP_CLUBS.map((c) => (
        <Link key={c.name} to={`/club/${entitySlug(c.name)}`}
          className="card-premium rounded-2xl p-4 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <p className="font-bold text-sm">{c.displayName ?? c.name}</p>
          {c.league && <p className="text-[10px] text-muted-foreground">{c.league}</p>}
        </Link>
      ))}
    </div>
  </div>
);

export default ClubsPage;
