import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { useEffect } from "react";

// Only allow same-origin relative paths as the post-auth redirect.
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const next = safeNext(params.get("next"));
  const returnUrl = window.location.origin + next;

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, navigate, next]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: returnUrl,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! تحقق من بريدك.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك!");
        navigate(next, { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشلت العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnUrl,
    });
    if (result.error) {
      toast.error("فشل الدخول عبر Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate(next, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | FUTHUB</title>
        <meta name="description" content="سجل دخولك إلى FUTHUB لحفظ لاعبيك المفضلين ومقارنة الإحصائيات." />
      </Helmet>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-2xl glow-primary">
                <span className="text-2xl font-black text-primary-foreground">FH</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-foreground mb-1">FUT<span className="text-gradient-primary">HUB</span></h1>
            <p className="text-sm text-muted-foreground">قاعدة بيانات EA FC 26</p>
          </div>

          {/* Card */}
          <div className="glass-strong rounded-3xl p-6 animate-in">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6">
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-fluid ${
                  mode === "signin" ? "bg-gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                }`}
              >
                دخول
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-fluid ${
                  mode === "signup" ? "bg-gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                }`}
              >
                حساب جديد
              </button>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full glass rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:border-primary/50 transition-fluid mb-4 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              <span className="text-sm font-semibold text-foreground">المتابعة عبر Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">أو</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === "signup" && (
                <div className="relative">
                  <UserIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="w-full glass rounded-xl pr-10 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  required
                  className="w-full glass rounded-xl pr-10 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  required
                  minLength={8}
                  className="w-full glass rounded-xl pr-10 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-3 font-bold text-sm shadow-lg glow-hover flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "جاري..." : mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              <Link to="/" className="hover:text-primary transition-fluid">← العودة للرئيسية</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
