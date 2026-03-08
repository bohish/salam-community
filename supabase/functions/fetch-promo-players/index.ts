const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FUTWIZ_BASE = "https://www.futwiz.com";

interface ScrapedPlayer {
  id: string;
  name: string;
  rating: number;
  position: string;
  altPosition: string;
  imageUrl: string;
  nationFlag: string;
  leagueLogo: string;
  clubBadge: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  price: string;
  addedDate: string;
  detailUrl: string;
  cardType: string;
}

function parsePlayersFromHtml(html: string, type: string): ScrapedPlayer[] {
  const players: ScrapedPlayer[] = [];
  
  // Match player card links with their data
  const cardRegex = /href="(\/fc26\/player\/[^"]+)"[^>]*>.*?<img[^>]*src="([^"]*faces\/[^"]*)"[^>]*>.*?(\d{2,3})\s*\\?\s*\\?\s*([A-Z]{2,3})\s*\\?\s*\\?\s*([^\\<]+?)\\?\s*\\?\s*([A-Z]{2,3})?/gs;
  
  // Simpler approach: extract key data points from the HTML structure
  // FUTWIZ uses a consistent card layout
  const sections = html.split(/href="(\/fc26\/player\/[^"]+)"/g);
  
  for (let i = 1; i < sections.length; i += 2) {
    const detailUrl = sections[i];
    const content = sections[i + 1] || '';
    
    // Extract face image
    const faceMatch = content.match(/faces\/(\d+)\.png/);
    const playerId = faceMatch ? faceMatch[1] : `p${i}`;
    const faceUrl = faceMatch ? `https://cdn.futwiz.com/cdn-cgi/image/width=350,quality=100,format=webp/assets/img/fc26/faces/${faceMatch[1]}.png` : '';
    
    // Extract rating
    const ratingMatch = content.match(/(\d{2,3})\s*\\\\/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
    
    // Extract position(s)
    const posMatches = content.match(/([A-Z]{2,3})\s*\\\\/g);
    const positions = posMatches ? posMatches.map(p => p.replace(/\\\\/g, '').trim()).filter(p => p.length <= 3) : [];
    
    // Extract name
    const nameMatch = content.match(/\\\\?\s*\\\\?\s*([A-Za-zÀ-ÿ\s\-'\.]+?)\\\\?\s*\\\\?\s*(?:[A-Z]{2,3})/);
    
    // Extract stats (6 numbers for PAC SHO PAS DRI DEF PHY)
    const statMatches = content.match(/(\d{2,3})\s*\\\\/g);
    const stats = statMatches ? statMatches.map(s => parseInt(s.replace(/\\\\/g, '').trim())).filter(n => n > 0 && n <= 99) : [];
    
    // Extract nation flag
    const flagMatch = content.match(/flags\/(\d+)\.png/);
    const flagUrl = flagMatch ? `https://cdn.futwiz.com/cdn-cgi/image/width=50,quality=100,format=webp/assets/img/fc26/flags/${flagMatch[1]}.png` : '';
    
    // Extract league logo
    const leagueMatch = content.match(/leagues\/(\d+)\.png/);
    const leagueUrl = leagueMatch ? `https://cdn.futwiz.com/cdn-cgi/image/width=50,quality=100,format=webp/assets/img/fc25/leagues/${leagueMatch[1]}.png` : '';
    
    // Extract club badge
    const badgeMatch = content.match(/badges\/(\d+)\.png/);
    const badgeUrl = badgeMatch ? `https://cdn.futwiz.com/cdn-cgi/image/width=50,quality=100,format=webp/assets/img/fc26/badges/${badgeMatch[1]}.png` : '';
    
    // Extract price
    const priceMatch = content.match(/([\d\.]+[KMB])/);
    
    // Extract added date
    const dateMatch = content.match(/Added:\s*(\d{2}\/\d{2}\/\d{2})/);
    
    // Extract player name from URL
    const urlNameMatch = detailUrl.match(/\/player\/([^\/]+)\//);
    const nameFromUrl = urlNameMatch ? urlNameMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
    
    if (rating > 0) {
      players.push({
        id: playerId,
        name: nameFromUrl,
        rating,
        position: positions[0] || 'N/A',
        altPosition: positions[1] || '',
        imageUrl: faceUrl,
        nationFlag: flagUrl,
        leagueLogo: leagueUrl,
        clubBadge: badgeUrl,
        pace: stats.length >= 7 ? stats[1] : 0,
        shooting: stats.length >= 7 ? stats[2] : 0,
        passing: stats.length >= 7 ? stats[3] : 0,
        dribbling: stats.length >= 7 ? stats[4] : 0,
        defending: stats.length >= 7 ? stats[5] : 0,
        physical: stats.length >= 7 ? stats[6] : 0,
        price: priceMatch ? priceMatch[1] : '',
        addedDate: dateMatch ? dateMatch[1] : '',
        detailUrl: `${FUTWIZ_BASE}${detailUrl}`,
        cardType: type,
      });
    }
  }
  
  return players;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'latest'; // latest, top

    let targetUrl: string;
    switch (type) {
      case 'latest':
        targetUrl = `${FUTWIZ_BASE}/fc26/players/latest`;
        break;
      case 'top':
        targetUrl = `${FUTWIZ_BASE}/fc26/players`;
        break;
      default:
        targetUrl = `${FUTWIZ_BASE}/fc26/players/latest`;
    }

    console.log(`Fetching ${type} players from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`FUTWIZ returned ${response.status}`);
    }

    const html = await response.text();
    const players = parsePlayersFromHtml(html, type);

    console.log(`Parsed ${players.length} players`);

    return new Response(JSON.stringify({
      players,
      total: players.length,
      type,
      source: 'futwiz',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      players: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
