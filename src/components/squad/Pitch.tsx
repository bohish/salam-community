import type { SquadSlotState } from "@/types/squad";
import SquadSlot from "./SquadSlot";
import type { ChemistryReport } from "@/lib/chemistry";

interface Props {
  slots: SquadSlotState[];
  chem: ChemistryReport;
  onSlotClick: (id: string) => void;
  onSlotClear: (id: string) => void;
  activeSlotId?: string | null;
}

const Pitch = ({ slots, chem, onSlotClick, onSlotClear, activeSlotId }: Props) => (
  <div className="relative w-full max-w-2xl mx-auto aspect-[2/3] rounded-3xl overflow-hidden border border-primary/25 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)]">
    {/* Pitch */}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b3f22_0%,#0a5a2b_45%,#0b3f22_100%)]" />
    {/* Alternating stripes for depth */}
    <div className="absolute inset-0 opacity-25 mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 8%, rgba(0,0,0,0.05) 8% 16%)",
      }} />
    {/* Field lines */}
    <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-white/40" fill="none" stroke="currentColor" strokeWidth="0.4">
      <rect x="2" y="2" width="96" height="146" rx="1" />
      <line x1="2" y1="75" x2="98" y2="75" />
      <circle cx="50" cy="75" r="10" />
      <circle cx="50" cy="75" r="0.6" fill="currentColor" />
      {/* Penalty boxes */}
      <rect x="20" y="2" width="60" height="18" />
      <rect x="35" y="2" width="30" height="7" />
      <rect x="20" y="130" width="60" height="18" />
      <rect x="35" y="141" width="30" height="7" />
    </svg>

    {/* Slots */}
    {slots.map((s) => (
      <SquadSlot
        key={s.id}
        slot={s}
        chem={chem.perSlot[s.id] ?? 0}
        outOfPos={chem.outOfPosition.includes(s.id)}
        onClick={() => onSlotClick(s.id)}
        onClear={() => onSlotClear(s.id)}
        active={activeSlotId === s.id}
      />
    ))}
  </div>
);

export default Pitch;
