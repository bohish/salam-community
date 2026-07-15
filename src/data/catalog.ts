// Curated catalog. The API has no list endpoints for clubs/leagues/nations,
// so we ship a curated seed. Each entry is used to query the API on demand.

export interface CatalogEntry {
  name: string;       // exact name expected by the API
  displayName?: string;
  country?: string;
  league?: string;
}

export const TOP_CLUBS: CatalogEntry[] = [
  { name: "Real Madrid", league: "LALIGA EA SPORTS" },
  { name: "FC Barcelona", league: "LALIGA EA SPORTS" },
  { name: "Manchester City", league: "Premier League" },
  { name: "Liverpool", league: "Premier League" },
  { name: "Arsenal", league: "Premier League" },
  { name: "Manchester Utd", league: "Premier League" },
  { name: "Chelsea", league: "Premier League" },
  { name: "Tottenham", league: "Premier League" },
  { name: "Paris SG", league: "Ligue 1" },
  { name: "Bayern München", league: "Bundesliga" },
  { name: "Borussia Dortmund", league: "Bundesliga" },
  { name: "Inter", league: "Serie A" },
  { name: "Juventus", league: "Serie A" },
  { name: "Milan", league: "Serie A" },
  { name: "Napoli", league: "Serie A" },
  { name: "Atlético de Madrid", league: "LALIGA EA SPORTS" },
  { name: "Newcastle Utd", league: "Premier League" },
  { name: "Aston Villa", league: "Premier League" },
  { name: "Al Nassr", league: "Roshn Saudi League" },
  { name: "Al Hilal", league: "Roshn Saudi League" },
  { name: "Al Ittihad", league: "Roshn Saudi League" },
  { name: "Al Ahli", league: "Roshn Saudi League" },
];

export const TOP_LEAGUES: CatalogEntry[] = [
  { name: "Premier League", country: "England" },
  { name: "LALIGA EA SPORTS", displayName: "LaLiga", country: "Spain" },
  { name: "Serie A", country: "Italy" },
  { name: "Bundesliga", country: "Germany" },
  { name: "Ligue 1", country: "France" },
  { name: "Roshn Saudi League", country: "Saudi Arabia" },
  { name: "Liga Portugal", country: "Portugal" },
  { name: "Eredivisie", country: "Netherlands" },
  { name: "MLS", country: "USA" },
  { name: "Süper Lig", country: "Turkey" },
];

// Sample popular clubs per league for the leagues page (client-side filter of team data)
export const CLUBS_BY_LEAGUE: Record<string, string[]> = {
  "Premier League": ["Manchester City", "Liverpool", "Arsenal", "Manchester Utd", "Chelsea", "Tottenham", "Newcastle Utd", "Aston Villa"],
  "LALIGA EA SPORTS": ["Real Madrid", "FC Barcelona", "Atlético de Madrid", "Athletic Club", "Villarreal", "Real Sociedad"],
  "Serie A": ["Inter", "Juventus", "Milan", "Napoli", "Roma", "Lazio", "Atalanta"],
  "Bundesliga": ["Bayern München", "Borussia Dortmund", "RB Leipzig", "Bayer 04 Leverkusen"],
  "Ligue 1": ["Paris SG", "Marseille", "Monaco", "Lyon"],
  "Roshn Saudi League": ["Al Nassr", "Al Hilal", "Al Ittihad", "Al Ahli"],
  "Liga Portugal": ["FC Porto", "SL Benfica", "Sporting CP"],
  "Eredivisie": ["Ajax", "PSV", "Feyenoord"],
  "MLS": ["Inter Miami CF", "LAFC"],
  "Süper Lig": ["Galatasaray", "Fenerbahçe"],
};

export const TOP_NATIONS: CatalogEntry[] = [
  { name: "France" },
  { name: "England" },
  { name: "Spain" },
  { name: "Brazil" },
  { name: "Argentina" },
  { name: "Portugal" },
  { name: "Germany" },
  { name: "Italy" },
  { name: "Netherlands" },
  { name: "Belgium" },
  { name: "Croatia" },
  { name: "Uruguay" },
  { name: "Morocco" },
  { name: "Egypt" },
  { name: "Saudi Arabia" },
  { name: "Norway" },
];
