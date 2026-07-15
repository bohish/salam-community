import { SlidersHorizontal, X } from "lucide-react";

export interface FiltersState {
  q: string;
  position: string;
  club: string;
  league: string;
  nation: string;
  foot: string;
  minRating: number;
  maxRating: number;
  minWeakFoot: number;
  minSkillMoves: number;
  minHeight: number;
  maxHeight: number;
  minAge: number;
  maxAge: number;
  sort: SortKey;
}

export type SortKey =
  | "rating" | "pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical"
  | "age-asc" | "age-desc" | "height-desc" | "name";

export const DEFAULT_FILTERS: FiltersState = {
  q: "",
  position: "",
  club: "",
  league: "",
  nation: "",
  foot: "",
  minRating: 0,
  maxRating: 99,
  minWeakFoot: 1,
  minSkillMoves: 1,
  minHeight: 150,
  maxHeight: 210,
  minAge: 15,
  maxAge: 45,
  sort: "rating",
};

const POSITIONS = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"];
const parseHeight = (h: string) => parseInt(h.replace(/[^\d]/g, "").slice(0, 3), 10) || 0;

export function applyFilters<T extends {
  name: string; rating: number; position: string; club: string; league: string; nation: string;
  preferredFoot: string; weakFoot: number; skillMoves: number; height: string; age: number;
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number;
}>(list: T[], f: FiltersState): T[] {
  const q = f.q.trim().toLowerCase();
  let out = list.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.club.toLowerCase().includes(q)) return false;
    if (f.position && p.position !== f.position) return false;
    if (f.club && !p.club.toLowerCase().includes(f.club.toLowerCase())) return false;
    if (f.league && !p.league.toLowerCase().includes(f.league.toLowerCase())) return false;
    if (f.nation && !p.nation.toLowerCase().includes(f.nation.toLowerCase())) return false;
    if (f.foot && p.preferredFoot !== f.foot) return false;
    if (p.rating < f.minRating || p.rating > f.maxRating) return false;
    if (p.weakFoot < f.minWeakFoot) return false;
    if (p.skillMoves < f.minSkillMoves) return false;
    const h = parseHeight(p.height);
    if (h && (h < f.minHeight || h > f.maxHeight)) return false;
    if (p.age && (p.age < f.minAge || p.age > f.maxAge)) return false;
    return true;
  });
  const key = f.sort;
  out.sort((a, b) => {
    switch (key) {
      case "name": return a.name.localeCompare(b.name);
      case "age-asc": return a.age - b.age;
      case "age-desc": return b.age - a.age;
      case "height-desc": return parseHeight(b.height) - parseHeight(a.height);
      case "pace": return b.pace - a.pace;
      case "shooting": return b.shooting - a.shooting;
      case "passing": return b.passing - a.passing;
      case "dribbling": return b.dribbling - a.dribbling;
      case "defending": return b.defending - a.defending;
      case "physical": return b.physical - a.physical;
      default: return b.rating - a.rating;
    }
  });
  return out;
}

const NumField = ({ label, min, max, value, onChange, step = 1 }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; step?: number }) => (
  <label className="block">
    <span className="text-[10px] text-muted-foreground">{label}</span>
    <input
      type="number" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5"
    />
  </label>
);

const AdvancedFilters = ({ value, onChange, onReset, open, onToggle }: {
  value: FiltersState;
  onChange: (v: FiltersState) => void;
  onReset: () => void;
  open: boolean;
  onToggle: () => void;
}) => {
  const set = <K extends keyof FiltersState>(k: K, v: FiltersState[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="glass-strong rounded-2xl overflow-hidden mb-4">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-sm font-bold">
        <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> فلاتر متقدمة</span>
        <span className="text-xs text-muted-foreground">{open ? "إخفاء" : "عرض"}</span>
      </button>
      {open && (
        <div className="p-3 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block col-span-2">
            <span className="text-[10px] text-muted-foreground">بحث</span>
            <input value={value.q} onChange={(e) => set("q", e.target.value)}
              placeholder="اسم أو نادي" className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5" />
          </label>

          <label className="block">
            <span className="text-[10px] text-muted-foreground">المركز</span>
            <select value={value.position} onChange={(e) => set("position", e.target.value)}
              className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5">
              <option value="">الكل</option>
              {POSITIONS.map((p) => <option key={p} value={p} className="bg-background">{p}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] text-muted-foreground">القدم</span>
            <select value={value.foot} onChange={(e) => set("foot", e.target.value)}
              className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5">
              <option value="">الكل</option>
              <option value="Left" className="bg-background">يسار</option>
              <option value="Right" className="bg-background">يمين</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] text-muted-foreground">النادي</span>
            <input value={value.club} onChange={(e) => set("club", e.target.value)}
              className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5" />
          </label>

          <label className="block">
            <span className="text-[10px] text-muted-foreground">الدوري</span>
            <input value={value.league} onChange={(e) => set("league", e.target.value)}
              className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5" />
          </label>

          <label className="block">
            <span className="text-[10px] text-muted-foreground">المنتخب</span>
            <input value={value.nation} onChange={(e) => set("nation", e.target.value)}
              className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5" />
          </label>

          <NumField label="أدنى تقييم" min={0} max={99} value={value.minRating} onChange={(v) => set("minRating", v)} />
          <NumField label="أعلى تقييم" min={0} max={99} value={value.maxRating} onChange={(v) => set("maxRating", v)} />
          <NumField label="القدم الضعيفة (min ★)" min={1} max={5} value={value.minWeakFoot} onChange={(v) => set("minWeakFoot", v)} />
          <NumField label="المهارات (min ★)" min={1} max={5} value={value.minSkillMoves} onChange={(v) => set("minSkillMoves", v)} />
          <NumField label="أدنى طول (سم)" min={150} max={210} value={value.minHeight} onChange={(v) => set("minHeight", v)} />
          <NumField label="أعلى طول (سم)" min={150} max={210} value={value.maxHeight} onChange={(v) => set("maxHeight", v)} />
          <NumField label="أدنى عمر" min={15} max={45} value={value.minAge} onChange={(v) => set("minAge", v)} />
          <NumField label="أعلى عمر" min={15} max={45} value={value.maxAge} onChange={(v) => set("maxAge", v)} />

          <label className="block col-span-2">
            <span className="text-[10px] text-muted-foreground">ترتيب حسب</span>
            <select value={value.sort} onChange={(e) => set("sort", e.target.value as SortKey)}
              className="w-full glass rounded-lg px-2 py-1.5 text-sm bg-transparent mt-0.5">
              <option value="rating" className="bg-background">التقييم</option>
              <option value="pace" className="bg-background">السرعة</option>
              <option value="shooting" className="bg-background">التسديد</option>
              <option value="passing" className="bg-background">التمرير</option>
              <option value="dribbling" className="bg-background">المراوغة</option>
              <option value="defending" className="bg-background">الدفاع</option>
              <option value="physical" className="bg-background">البدنية</option>
              <option value="age-asc" className="bg-background">الأصغر سناً</option>
              <option value="age-desc" className="bg-background">الأكبر سناً</option>
              <option value="height-desc" className="bg-background">الأطول</option>
              <option value="name" className="bg-background">حسب الاسم</option>
            </select>
          </label>

          <button onClick={onReset} className="col-span-2 md:col-span-4 flex items-center justify-center gap-1 text-xs text-destructive glass rounded-lg py-2 hover:bg-destructive/10">
            <X className="w-3 h-3" /> إعادة تعيين
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
