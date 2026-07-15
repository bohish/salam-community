import { Link } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";

export interface Crumb { label: string; href?: string; }

const Breadcrumbs = ({ items }: { items: Crumb[] }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "/" },
      ...items.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        ...(c.href ? { item: c.href } : {}),
      })),
    ],
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <nav aria-label="breadcrumbs" className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-primary transition-fluid">
          <Home className="w-3 h-3" />
        </Link>
        {items.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <ChevronLeft className="w-3 h-3 opacity-50" />
            {c.href && i < items.length - 1 ? (
              <Link to={c.href} className="hover:text-primary transition-fluid truncate max-w-[140px]">{c.label}</Link>
            ) : (
              <span className="text-foreground font-semibold truncate max-w-[180px]">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;
