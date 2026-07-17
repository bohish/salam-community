import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, CheckCircle2, XCircle } from "lucide-react";

type SupabaseWithOAuth = typeof supabase & {
  auth: typeof supabase.auth & {
    oauth: {
      getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
      approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
      denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
    };
  };
};
const sb = supabase as SupabaseWithOAuth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("رابط التفويض غير صالح (authorization_id مفقود)");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
        return;
      }
      const resp = await sb.auth.oauth.getAuthorizationDetails(authorizationId);
      const data = resp.data as any;
      const err = resp.error as any;
      if (!active) return;
      if (err) {
        setError(err.message || "تعذر جلب تفاصيل التفويض");
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    const resp = approve
      ? await sb.auth.oauth.approveAuthorization(authorizationId)
      : await sb.auth.oauth.denyAuthorization(authorizationId);
    const data = resp.data as any;
    const err = resp.error as any;
    if (err) {
      setBusy(false);
      setError(err.message || "فشلت العملية");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("لم يتم إرجاع رابط لإكمال التفويض.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-6 max-w-md w-full text-center">
          <XCircle className="mx-auto mb-3 text-destructive" size={40} />
          <h1 className="text-lg font-bold text-foreground mb-2">تعذّر إكمال التفويض</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </main>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "تطبيق خارجي";
  const scopes: string[] = Array.isArray(details.scopes)
    ? details.scopes
    : typeof details.scope === "string"
      ? details.scope.split(" ").filter(Boolean)
      : [];

  return (
    <main className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <div className="glass-strong rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <Shield className="text-primary-foreground" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">ربط {clientName}</h1>
            <p className="text-xs text-muted-foreground">بحساب futmac.com الخاص بك</p>
          </div>
        </div>

        <p className="text-sm text-foreground/90 mb-4 leading-relaxed">
          سيتمكن <span className="font-bold">{clientName}</span> من استخدام أدوات futmac.com نيابةً عنك
          (البحث عن اللاعبين، تفاصيل البطاقات، وإدارة قائمة المفضلة الخاصة بك).
        </p>

        {scopes.length > 0 && (
          <div className="glass rounded-xl p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-2">الصلاحيات المطلوبة:</p>
            <ul className="space-y-1">
              {scopes.map((s) => (
                <li key={s} className="text-xs text-foreground flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-primary" /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mb-5">
          هذا لا يتجاوز صلاحيات التطبيق أو سياسات قاعدة البيانات. يمكنك إلغاء الوصول في أي وقت.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => decide(false)}
            disabled={busy}
            className="flex-1 glass rounded-xl py-3 text-sm font-bold text-foreground hover:border-destructive/50 transition-fluid disabled:opacity-50"
          >
            رفض
          </button>
          <button
            onClick={() => decide(true)}
            disabled={busy}
            className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-bold shadow-lg glow-hover disabled:opacity-50"
          >
            {busy ? "جاري..." : "الموافقة والربط"}
          </button>
        </div>
      </div>
    </main>
  );
}
