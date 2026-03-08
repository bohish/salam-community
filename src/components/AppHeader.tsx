import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2" onClick={() => navigate("/")} role="button">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-sm">FH</span>
            </div>
            <span className="font-extrabold text-lg text-foreground tracking-tight">
              FUT<span className="text-primary">HUB</span>
            </span>
          </div>

          {/* Search shortcut */}
          <button
            onClick={() => navigate("/search")}
            className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 text-sm text-muted-foreground border border-border hover:border-primary/50 transition-colors flex-1 mx-4 max-w-sm"
          >
            <Search size={14} />
            <span>ابحث عن لاعب...</span>
          </button>

          {/* FC badge */}
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            FC 25
          </span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
