import { X, Sparkles, Star } from "lucide-react";
import type { SquadSlotState } from "@/types/squad";
import { cn } from "@/lib/utils";

interface Props {
  slot: SquadSlotState;
  chem: number;
  outOfPos?: boolean;
  onClick: () => void;
  onClear: () => void;
  active?: boolean;
}

const ratingTone = (r: number) => {
  if (r >= 90) return "from-emerald-500 to-emerald-700 text-white";
  if (r >= 84) return "from-primary to-primary/70 text-primary-foreground";
  if (r >= 78) return "from-amber-500 to-amber-700 text-white";
  return "from-slate-500 to-slate-700 text-white";
};

const chemColor = (n: number) => {
  if (n >= 3) return "bg-emerald-500 shadow-[0_0_10px_theme(colors.emerald.500)]";
  if (n === 2) return "bg-amber-400";
  if (n === 1) return "bg-orange-500";
  return "bg-destructive/80";
};

const SquadSlot = ({ slot, chem, outOfPos, onClick, onClear, active }: Props) => {
  const p = slot.player;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 group transition-fluid",
        "focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl",
        active && "ring-2 ring-primary",
      )}
      style={{ left: `${slot.x}%`, bottom: `${slot.y}%`, width: 78 }}
      aria-label={`${slot.position} ${p ? p.name : "خانة فارغة"}`}
    >
      {p ? (
        <div className="relative animate-in fade-in zoom-in-95 duration-300">
          {p.cardUrl ? (
            <img
              src={p.cardUrl}
              alt={p.name}
              loading="lazy"
              className="w-[78px] h-[108px] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-fluid"
            />
          ) : (
            <div className={cn(
              "w-[78px] h-[108px] rounded-xl bg-gradient-to-br flex flex-col items-center justify-center border border-border/50 shadow-lg",
              ratingTone(p.rating),
            )}>
              <span className="text-2xl font-black leading-none">{p.rating}</span>
              <span className="text-[10px] font-bold opacity-90">{slot.position}</span>
              <span className="text-[9px] px-1 mt-1 truncate max-w-full opacity-90">{p.name.split(" ").pop()}</span>
            </div>
          )}
          {/* rating chip */}
          <span className={cn(
            "absolute top-0 right-0 -mr-1 -mt-1 text-[10px] font-black rounded-md px-1.5 py-0.5 bg-gradient-to-br shadow",
            ratingTone(p.rating),
          )}>
            {p.rating}
          </span>
          {/* chem dot */}
          <span className={cn(
            "absolute bottom-0 left-0 -ml-1 -mb-1 w-3.5 h-3.5 rounded-full ring-2 ring-background",
            outOfPos ? "bg-destructive/90" : chemColor(chem),
          )} title={outOfPos ? "خارج المركز" : `كيمياء ${chem}/3`} />
          {p.isSpecial && (
            <Star className="absolute top-1 left-1 w-3 h-3 text-amber-300 fill-amber-300 drop-shadow" />
          )}
          {/* remove */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-fluid shadow"
            aria-label="إزالة"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="mt-1 text-[10px] font-bold text-center truncate w-[78px] text-foreground/95 drop-shadow">
            {p.name}
          </div>
        </div>
      ) : (
        <div className="w-[78px] h-[108px] rounded-xl border-2 border-dashed border-primary/40 bg-background/40 backdrop-blur-sm grid place-items-center hover:border-primary hover:bg-primary/10 transition-fluid">
          <div className="flex flex-col items-center gap-1 text-primary/70">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black">{slot.position}</span>
            <span className="text-[9px] opacity-70">أضف لاعب</span>
          </div>
        </div>
      )}
    </button>
  );
};

export default SquadSlot;
