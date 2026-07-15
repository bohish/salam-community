import { Helmet } from "react-helmet-async";
import { useCompare } from "@/hooks/useCompare";
import { X, Users, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Player } from "@/types/player";

const stats: { key: keyof Player; label: string }[] = [
  { key: "pace", label: "PAC" },
  { key: "shooting", label: "SHO" },
  { key: "passing", label: "PAS" },
  { key: "dribbling", label: "DRI" },
  { key: "defending", label: "DEF" },
  { key: "physical", label: "PHY" },
];

const ComparePage = () => {
  const { players, remove, clear } = useCompare();

  const bestValues = new Map<string, number>();
  stats.forEach(({ key }) => {
    const max = Math.max(...players.map((p) => (p[key] as number) || 0));
    bestValues.set(key, max);
  });

  return (
    <>
      <Helmet>
        <title>مقارنة اللاعبين | FUTHUB</title>
        <meta name="description" content="قارن بين حتى 4 لاعبين من EA FC 26 جنبًا إلى جنب مع كل الإحصائيات." />
      </Helmet>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-foreground">المقارنة</h1>
            <p className="text-xs text-muted-foreground">قارن حتى 4 لاعبين ({players.length}/4)</p>
          </div>
          {players.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-fluid"
            >
              <Trash2 size={12} /> مسح الكل
            </button>
          )}
        </div>

        {players.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center animate-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users size={28} className="text-primary" />
            </div>
            <h2 className="font-black text-xl text-foreground mb-2">لا يوجد لاعبين للمقارنة</h2>
            <p className="text-sm text-muted-foreground mb-6">أضف لاعبين من صفحاتهم لتقارن بينهم</p>
            <Link
              to="/players"
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-lg glow-hover"
            >
              تصفح اللاعبين
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Player headers */}
            <div className={`grid gap-3`} style={{ gridTemplateColumns: `100px repeat(${players.length}, 1fr)` }}>
              <div />
              {players.map((p) => (
                <div key={p.id} className="glass-strong rounded-2xl p-3 relative animate-in">
                  <button
                    onClick={() => remove(p.id)}
                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                  <div className="w-14 h-14 mx-auto rounded-full bg-secondary overflow-hidden mb-2">
                    {p.avatarUrl && <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  </div>
                  <p className="text-xs font-bold text-foreground text-center truncate">{p.name.split(" ").pop()}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`rating-chip text-[10px] ${p.rating >= 86 ? "rating-chip-elite" : ""}`}>{p.rating}</span>
                    <span className="text-[9px] text-muted-foreground font-bold">{p.position}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats rows */}
            <div className="glass-strong rounded-2xl overflow-hidden">
              {stats.map(({ key, label }, i) => (
                <div
                  key={key}
                  className={`grid gap-3 items-center px-3 py-3 ${i % 2 ? "bg-secondary/20" : ""}`}
                  style={{ gridTemplateColumns: `100px repeat(${players.length}, 1fr)` }}
                >
                  <span className="text-xs font-bold text-muted-foreground">{label}</span>
                  {players.map((p) => {
                    const value = (p[key] as number) || 0;
                    const isBest = value === bestValues.get(key as string) && players.length > 1;
                    return (
                      <div key={p.id} className="text-center">
                        <span className={`inline-block px-2 py-1 rounded-lg text-sm font-black ${
                          isBest ? "bg-gradient-primary text-primary-foreground" : "text-foreground"
                        }`}>
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Extra attributes */}
            <div className={`grid gap-3`} style={{ gridTemplateColumns: `100px repeat(${players.length}, 1fr)` }}>
              <span className="text-xs font-bold text-muted-foreground self-center">النادي</span>
              {players.map((p) => (
                <div key={p.id} className="glass rounded-xl p-2 text-center">
                  <p className="text-[10px] text-foreground truncate">{p.club}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ComparePage;
