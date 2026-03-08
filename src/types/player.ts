export interface PlayStyle {
  name: string;
  icon: string;
}

export interface Player {
  id: number;
  name: string;
  rating: number;
  position: string;
  nation: string;
  nationImage: string;
  league: string;
  club: string;
  clubImage: string;
  avatarUrl: string;
  shieldUrl: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  skillMoves: number;
  weakFoot: number;
  height: number;
  weight: number;
  birthdate: string;
  alternatePositions: string[];
  playStyles: PlayStyle[];
  playStylesPlus: PlayStyle[];
}

export interface PlayersResponse {
  players: Player[];
  total: number;
  limit: number;
  offset: number;
}
