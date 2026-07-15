// Normalized Player type sourced from https://api.msmc.cc/api/fc26
export interface RawPlayer {
  ID: string;
  Rank: string;
  Name: string;
  GENDER: "M" | "F" | string;
  OVR: string;
  PAC: string; SHO: string; PAS: string; DRI: string; DEF: string; PHY: string;
  Position: string;
  "Weak foot": string;
  "Skill moves": string;
  "Preferred foot": string;
  Height: string;
  Weight: string;
  "Alternative positions": string[] | null;
  Age: string;
  Nation: string;
  League: string;
  Team: string;
  "play style": string[] | null;
  url: string;
  card: string;
  [key: string]: any;
}

export interface PlayerStat { label: string; key: keyof RawPlayer & string; value: number; }
export interface PlayerStatGroup { title: string; stats: PlayerStat[]; }

export interface Player {
  id: number;
  rank: number;
  name: string;
  gender: "M" | "F";
  rating: number;
  position: string;
  altPositions: string[];
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number;
  weakFoot: number;
  skillMoves: number;
  preferredFoot: string;
  height: string;
  weight: string;
  age: number;
  nation: string;
  league: string;
  club: string;
  playStyles: string[];
  cardUrl: string;
  eaUrl: string;
  isGK: boolean;
  raw: RawPlayer;
}

const num = (v: any): number => {
  const n = parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
};

export const normalizePlayer = (r: RawPlayer): Player => ({
  id: num(r.ID),
  rank: num(r.Rank),
  name: r.Name ?? "",
  gender: (r.GENDER as any) === "F" ? "F" : "M",
  rating: num(r.OVR),
  position: r.Position ?? "",
  altPositions: Array.isArray(r["Alternative positions"]) ? r["Alternative positions"]! : [],
  pace: num(r.PAC), shooting: num(r.SHO), passing: num(r.PAS),
  dribbling: num(r.DRI), defending: num(r.DEF), physical: num(r.PHY),
  weakFoot: num(r["Weak foot"]),
  skillMoves: num(r["Skill moves"]),
  preferredFoot: r["Preferred foot"] ?? "",
  height: r.Height ?? "",
  weight: r.Weight ?? "",
  age: num(r.Age),
  nation: r.Nation ?? "",
  league: r.League ?? "",
  club: r.Team ?? "",
  playStyles: Array.isArray(r["play style"]) ? r["play style"]! : [],
  cardUrl: r.card ?? "",
  eaUrl: r.url ?? "",
  isGK: (r.Position ?? "") === "GK",
  raw: r,
});

export const buildStatGroups = (p: Player): PlayerStatGroup[] => {
  const r = p.raw;
  if (p.isGK) {
    return [{
      title: "Goalkeeping",
      stats: [
        { label: "Diving", key: "GK Diving", value: num(r["GK Diving"]) },
        { label: "Handling", key: "GK Handling", value: num(r["GK Handling"]) },
        { label: "Kicking", key: "GK Kicking", value: num(r["GK Kicking"]) },
        { label: "Reflexes", key: "GK Reflexes", value: num(r["GK Reflexes"]) },
        { label: "Positioning", key: "GK Positioning", value: num(r["GK Positioning"]) },
        { label: "Reactions", key: "Reactions", value: num(r["Reactions"]) },
      ],
    }];
  }
  return [
    { title: "Pace", stats: [
      { label: "Acceleration", key: "Acceleration", value: num(r["Acceleration"]) },
      { label: "Sprint Speed", key: "Sprint Speed", value: num(r["Sprint Speed"]) },
    ]},
    { title: "Shooting", stats: [
      { label: "Positioning", key: "Positioning", value: num(r["Positioning"]) },
      { label: "Finishing", key: "Finishing", value: num(r["Finishing"]) },
      { label: "Shot Power", key: "Shot Power", value: num(r["Shot Power"]) },
      { label: "Long Shots", key: "Long Shots", value: num(r["Long Shots"]) },
      { label: "Volleys", key: "Volleys", value: num(r["Volleys"]) },
      { label: "Penalties", key: "Penalties", value: num(r["Penalties"]) },
    ]},
    { title: "Passing", stats: [
      { label: "Vision", key: "Vision", value: num(r["Vision"]) },
      { label: "Crossing", key: "Crossing", value: num(r["Crossing"]) },
      { label: "Free Kick", key: "Free Kick Accuracy", value: num(r["Free Kick Accuracy"]) },
      { label: "Short Pass", key: "Short Passing", value: num(r["Short Passing"]) },
      { label: "Long Pass", key: "Long Passing", value: num(r["Long Passing"]) },
      { label: "Curve", key: "Curve", value: num(r["Curve"]) },
    ]},
    { title: "Dribbling", stats: [
      { label: "Agility", key: "Agility", value: num(r["Agility"]) },
      { label: "Balance", key: "Balance", value: num(r["Balance"]) },
      { label: "Reactions", key: "Reactions", value: num(r["Reactions"]) },
      { label: "Ball Control", key: "Ball Control", value: num(r["Ball Control"]) },
      { label: "Dribbling", key: "Dribbling", value: num(r["Dribbling"]) },
      { label: "Composure", key: "Composure", value: num(r["Composure"]) },
    ]},
    { title: "Defending", stats: [
      { label: "Interceptions", key: "Interceptions", value: num(r["Interceptions"]) },
      { label: "Heading", key: "Heading Accuracy", value: num(r["Heading Accuracy"]) },
      { label: "Def Awareness", key: "Def Awareness", value: num(r["Def Awareness"]) },
      { label: "Stand Tackle", key: "Standing Tackle", value: num(r["Standing Tackle"]) },
      { label: "Slide Tackle", key: "Sliding Tackle", value: num(r["Sliding Tackle"]) },
    ]},
    { title: "Physical", stats: [
      { label: "Jumping", key: "Jumping", value: num(r["Jumping"]) },
      { label: "Stamina", key: "Stamina", value: num(r["Stamina"]) },
      { label: "Strength", key: "Strength", value: num(r["Strength"]) },
      { label: "Aggression", key: "Aggression", value: num(r["Aggression"]) },
    ]},
  ];
};
