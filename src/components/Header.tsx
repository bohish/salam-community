import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = ["اللاعبين", "باني الفريق", "الأسعار", "الأخبار"];

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="font-heading font-bold text-primary-foreground text-lg">F</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              FUT<span className="text-primary">HUB</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search size={16} className="absolute left-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن لاعب..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-secondary rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 w-64 transition-all"
            />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن لاعب..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-secondary rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-right py-2"
              >
                {item}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
