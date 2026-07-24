// Formation layouts. Coordinates are % of pitch (x = width, y = length from own goal → opponent).
// The pitch is rendered vertically with the goalkeeper at the bottom and attackers at the top.
export type SlotPos =
  | "GK" | "LB" | "CB" | "RB" | "RWB" | "LWB"
  | "CDM" | "CM" | "CAM" | "LM" | "RM"
  | "LW" | "RW" | "ST" | "CF";

export interface FormationSlot {
  id: string;         // stable slot id
  position: SlotPos;
  x: number;          // 0-100
  y: number;          // 0-100 (0 = bottom / own goal)
}

export interface Formation {
  id: string;
  label: string;
  slots: FormationSlot[];
}

const gk: FormationSlot = { id: "gk", position: "GK", x: 50, y: 6 };

export const FORMATIONS: Formation[] = [
  {
    id: "4-3-3",
    label: "4-3-3",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 24 },
      { id: "lcb", position: "CB", x: 34, y: 20 },
      { id: "rcb", position: "CB", x: 66, y: 20 },
      { id: "rb", position: "RB", x: 88, y: 24 },
      { id: "lcm", position: "CM", x: 26, y: 48 },
      { id: "cm", position: "CM", x: 50, y: 44 },
      { id: "rcm", position: "CM", x: 74, y: 48 },
      { id: "lw", position: "LW", x: 14, y: 78 },
      { id: "st", position: "ST", x: 50, y: 84 },
      { id: "rw", position: "RW", x: 86, y: 78 },
    ],
  },
  {
    id: "4-2-3-1",
    label: "4-2-3-1",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 24 },
      { id: "lcb", position: "CB", x: 34, y: 20 },
      { id: "rcb", position: "CB", x: 66, y: 20 },
      { id: "rb", position: "RB", x: 88, y: 24 },
      { id: "lcdm", position: "CDM", x: 34, y: 40 },
      { id: "rcdm", position: "CDM", x: 66, y: 40 },
      { id: "lm", position: "LM", x: 16, y: 66 },
      { id: "cam", position: "CAM", x: 50, y: 64 },
      { id: "rm", position: "RM", x: 84, y: 66 },
      { id: "st", position: "ST", x: 50, y: 86 },
    ],
  },
  {
    id: "4-4-2",
    label: "4-4-2",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 24 },
      { id: "lcb", position: "CB", x: 34, y: 20 },
      { id: "rcb", position: "CB", x: 66, y: 20 },
      { id: "rb", position: "RB", x: 88, y: 24 },
      { id: "lm", position: "LM", x: 14, y: 52 },
      { id: "lcm", position: "CM", x: 38, y: 50 },
      { id: "rcm", position: "CM", x: 62, y: 50 },
      { id: "rm", position: "RM", x: 86, y: 52 },
      { id: "lst", position: "ST", x: 36, y: 82 },
      { id: "rst", position: "ST", x: 64, y: 82 },
    ],
  },
  {
    id: "3-4-3",
    label: "3-4-3",
    slots: [
      gk,
      { id: "lcb", position: "CB", x: 22, y: 22 },
      { id: "ccb", position: "CB", x: 50, y: 18 },
      { id: "rcb", position: "CB", x: 78, y: 22 },
      { id: "lm", position: "LM", x: 12, y: 50 },
      { id: "lcm", position: "CM", x: 38, y: 48 },
      { id: "rcm", position: "CM", x: 62, y: 48 },
      { id: "rm", position: "RM", x: 88, y: 50 },
      { id: "lw", position: "LW", x: 18, y: 80 },
      { id: "st", position: "ST", x: 50, y: 86 },
      { id: "rw", position: "RW", x: 82, y: 80 },
    ],
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    slots: [
      gk,
      { id: "lcb", position: "CB", x: 22, y: 22 },
      { id: "ccb", position: "CB", x: 50, y: 18 },
      { id: "rcb", position: "CB", x: 78, y: 22 },
      { id: "lm", position: "LM", x: 10, y: 54 },
      { id: "lcm", position: "CM", x: 32, y: 46 },
      { id: "cam", position: "CAM", x: 50, y: 62 },
      { id: "rcm", position: "CM", x: 68, y: 46 },
      { id: "rm", position: "RM", x: 90, y: 54 },
      { id: "lst", position: "ST", x: 36, y: 84 },
      { id: "rst", position: "ST", x: 64, y: 84 },
    ],
  },
  {
    id: "4-3-2-1",
    label: "4-3-2-1",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 24 },
      { id: "lcb", position: "CB", x: 34, y: 20 },
      { id: "rcb", position: "CB", x: 66, y: 20 },
      { id: "rb", position: "RB", x: 88, y: 24 },
      { id: "lcm", position: "CM", x: 26, y: 46 },
      { id: "cm", position: "CM", x: 50, y: 42 },
      { id: "rcm", position: "CM", x: 74, y: 46 },
      { id: "lcam", position: "CAM", x: 32, y: 68 },
      { id: "rcam", position: "CAM", x: 68, y: 68 },
      { id: "st", position: "ST", x: 50, y: 88 },
    ],
  },
];

export const getFormation = (id: string): Formation =>
  FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
