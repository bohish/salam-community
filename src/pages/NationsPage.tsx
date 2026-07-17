import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Globe2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TOP_NATIONS } from "@/data/catalog";
import { entitySlug } from "@/lib/slug";

const NationsPage = () => (
  <div className="container mx-auto px-4 py-4 max-w-3xl">
    <Helmet>
      <title>المنتخبات — FUTMAC FC 26</title>
      <meta name="description" content="تصفح لاعبي المنتخبات في EA SPORTS FC 26." />
      <link rel="canonical" href="/nations" />
    </Helmet>

    <Breadcrumbs items={[{ label: "المنتخبات" }]} />

    <h1 className="text-2xl font-black mb-4">المنتخبات</h1>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {TOP_NATIONS.map((n) => (
        <Link key={n.name} to={`/nation/${entitySlug(n.name)}`}
          className="card-premium rounded-2xl p-4 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-primary/20 flex items-center justify-center">
            <Globe2 className="w-6 h-6 text-primary" />
          </div>
          <p className="font-bold text-sm">{n.displayName ?? n.name}</p>
        </Link>
      ))}
    </div>
  </div>
);

export default NationsPage;
