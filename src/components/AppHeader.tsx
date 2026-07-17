import { User, LogOut, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import SearchSuggestions from "./SearchSuggestions";

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg glow-hover overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
              <span className="relative font-black text-primary-foreground text-sm tracking-tighter">FM</span>
            </div>
            <div className="hidden sm:block text-right leading-none">
              <h1 className="font-black text-lg text-foreground tracking-tight">
                FUT<span className="text-gradient-primary">MAC</span>
              </h1>
              <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-[0.15em]">EA FC 26</p>
            </div>
          </button>

          <div className="flex-1 max-w-md">
            <SearchSuggestions variant="compact" placeholder="ابحث عن لاعب..." />
          </div>

          <div className="relative shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg glow-hover"
                >
                  {(user.email?.[0] || "U").toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute left-0 mt-2 w-60 glass-strong rounded-2xl p-2 z-50 animate-scale-in">
                      <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">مسجل باسم</p>
                        <p className="text-sm font-bold text-foreground truncate mt-0.5">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setMenuOpen(false); navigate("/favorites"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-primary/10 text-right transition-fluid">
                        <Heart size={15} className="text-primary" /> المفضلة
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 text-right transition-fluid">
                        <LogOut size={15} /> تسجيل الخروج
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button onClick={() => navigate("/auth")} className="btn-primary !py-2 !px-4 text-xs">
                <User size={14} /> دخول
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
