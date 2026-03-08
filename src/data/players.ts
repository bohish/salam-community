export type CardType = "gold" | "totw" | "toty" | "icon";

export interface Player {
  id: number;
  name: string;
  nameAr?: string;
  rating: number;
  position: string;
  nation: string;
  league: string;
  club: string;
  cardType: CardType;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  price: number;
  priceChange: number; // percentage
  imageUrl?: string;
}

export const players: Player[] = [
  {
    id: 1, name: "Mbappé", rating: 97, position: "ST",
    nation: "🇫🇷", league: "La Liga", club: "Real Madrid", cardType: "toty",
    pace: 99, shooting: 96, passing: 88, dribbling: 97, defending: 36, physical: 78,
    price: 3200000, priceChange: 2.5,
  },
  {
    id: 2, name: "Haaland", rating: 96, position: "ST",
    nation: "🇳🇴", league: "Premier League", club: "Man City", cardType: "toty",
    pace: 89, shooting: 97, passing: 72, dribbling: 84, defending: 48, physical: 95,
    price: 2800000, priceChange: -1.2,
  },
  {
    id: 3, name: "Vinícius Jr", rating: 95, position: "LW",
    nation: "🇧🇷", league: "La Liga", club: "Real Madrid", cardType: "totw",
    pace: 98, shooting: 90, passing: 85, dribbling: 97, defending: 30, physical: 70,
    price: 1950000, priceChange: 5.3,
  },
  {
    id: 4, name: "Salah", rating: 93, position: "RW",
    nation: "🇪🇬", league: "Premier League", club: "Liverpool", cardType: "totw",
    pace: 93, shooting: 92, passing: 84, dribbling: 91, defending: 45, physical: 75,
    price: 890000, priceChange: -0.8,
  },
  {
    id: 5, name: "De Bruyne", rating: 92, position: "CAM",
    nation: "🇧🇪", league: "Premier League", club: "Man City", cardType: "gold",
    pace: 74, shooting: 88, passing: 95, dribbling: 88, defending: 64, physical: 78,
    price: 320000, priceChange: 1.1,
  },
  {
    id: 6, name: "Bellingham", rating: 91, position: "CM",
    nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", league: "La Liga", club: "Real Madrid", cardType: "gold",
    pace: 82, shooting: 86, passing: 83, dribbling: 89, defending: 76, physical: 84,
    price: 410000, priceChange: 3.7,
  },
  {
    id: 7, name: "Ronaldinho", rating: 94, position: "CAM",
    nation: "🇧🇷", league: "Icons", club: "Icon", cardType: "icon",
    pace: 91, shooting: 88, passing: 90, dribbling: 96, defending: 30, physical: 72,
    price: 5100000, priceChange: 0.5,
  },
  {
    id: 8, name: "Zidane", rating: 96, position: "CAM",
    nation: "🇫🇷", league: "Icons", club: "Icon", cardType: "icon",
    pace: 84, shooting: 90, passing: 94, dribbling: 96, defending: 55, physical: 80,
    price: 7200000, priceChange: -2.1,
  },
  {
    id: 9, name: "Rodri", rating: 91, position: "CDM",
    nation: "🇪🇸", league: "Premier League", club: "Man City", cardType: "gold",
    pace: 65, shooting: 74, passing: 86, dribbling: 83, defending: 89, physical: 87,
    price: 195000, priceChange: 0.3,
  },
  {
    id: 10, name: "Messi", rating: 93, position: "RW",
    nation: "🇦🇷", league: "MLS", club: "Inter Miami", cardType: "gold",
    pace: 81, shooting: 92, passing: 93, dribbling: 95, defending: 34, physical: 62,
    price: 520000, priceChange: -3.2,
  },
  {
    id: 11, name: "Van Dijk", rating: 90, position: "CB",
    nation: "🇳🇱", league: "Premier League", club: "Liverpool", cardType: "gold",
    pace: 72, shooting: 55, passing: 72, dribbling: 68, defending: 92, physical: 88,
    price: 145000, priceChange: 1.5,
  },
  {
    id: 12, name: "Maradona", rating: 97, position: "CAM",
    nation: "🇦🇷", league: "Icons", club: "Icon", cardType: "icon",
    pace: 90, shooting: 93, passing: 92, dribbling: 98, defending: 38, physical: 70,
    price: 9500000, priceChange: 0.8,
  },
];

export const positions = ["ST", "LW", "RW", "CAM", "CM", "CDM", "CB", "LB", "RB", "GK"];
export const leagues = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "MLS", "Icons"];
export const cardTypes: CardType[] = ["gold", "totw", "toty", "icon"];
