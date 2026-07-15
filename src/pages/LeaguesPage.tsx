import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Trophy } from "lucide-react";
import { TOP_LEAGUES } from "@/data/catalog";

const LeaguesPage = () => (
  <div className="container mx-auto px-4 py-4 max-w-3xl">
    <Helmet>
      <title>الدوريات — FUTHUB FC 26</title>
      <meta name="description" content="أشهر دوريات EA SPORTS FC 26 وأنديتها." />
    </Helmet>

    <h1 className="text-2xl font-black mb-4">الدوريات</h1>
    <div className="grid gap-3">
      {TOP_LEAGUES.map((l) => (
        <Link
          key={l.name}
          to={`/league/${encodeURIComponent(l.name)}`}
          className="card-premium rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold">{l.displayName ?? l.name}</p>
            {l.country && <p className="text-xs text-muted-foreground">{l.country}</p>}
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default LeaguesPage;
