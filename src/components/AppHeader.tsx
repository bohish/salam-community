import { Search, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg glow-hover">
              <span className="font-black text-primary-foreground text-sm">FH</span>
            </div>
            <div className="hidden sm:block text-right">
              <h1 className="font-black text-lg leading-none text-foreground">FUT<span className="text-gradient-primary">HUB</span></h1>
              <p className="text-[9px] text-muted-foreground leading-tight">EA FC 26 Database</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/search")}
            className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm text-muted-foreground flex-1 max-w-sm hover:border-primary/50 transition-fluid"
          >
            <Search size={14} />
            <span className="text-xs">ابحث عن لاعب...</span>
          </button>

          <div className="relative shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg"
                >
                  {(user.email?.[0] || "U").toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute left-0 mt-2 w-56 glass-strong rounded-xl p-2 z-50 animate-scale-in">
                      <div className="px-3 py-2 border-b border-border/50 mb-1">
                        <p className="text-xs text-muted-foreground">مسجل باسم</p>
                        <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setMenuOpen(false); navigate("/favorites"); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/70 text-right"
                      >
                        <User size={14} /> المفضلة
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 text-right"
                      >
                        <LogOut size={14} /> تسجيل الخروج
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 bg-gradient-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg glow-hover"
              >
                دخول
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
