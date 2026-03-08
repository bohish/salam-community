const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EA_API_URL = "https://drop-api.ea.com/rating/ea-sports-fc";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const gender = url.searchParams.get('gender') || '0'; // 0 = men, 1 = women

    const params = new URLSearchParams({
      locale: 'en',
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString(),
    });

    // EA API filters by gender
    // We fetch from EA and let the client filter by search if needed

    const response = await fetch(`${EA_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`EA API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    // Transform EA data to our format
    const players = data.items
      .filter((item: any) => item.gender?.id === parseInt(gender))
      .map((item: any) => ({
        id: item.id,
        name: item.commonName || `${item.firstName} ${item.lastName}`,
        rating: item.overallRating,
        position: item.position?.shortLabel || 'N/A',
        nation: item.nationality?.label || '',
        nationImage: item.nationality?.imageUrl || '',
        league: item.leagueName || '',
        club: item.team?.label || '',
        clubImage: item.team?.imageUrl || '',
        avatarUrl: item.avatarUrl || '',
        shieldUrl: item.shieldUrl || '',
        pace: item.stats?.pac?.value || 0,
        shooting: item.stats?.sho?.value || 0,
        passing: item.stats?.pas?.value || 0,
        dribbling: item.stats?.dri?.value || 0,
        defending: item.stats?.def?.value || 0,
        physical: item.stats?.phy?.value || 0,
        skillMoves: item.skillMoves || 0,
        weakFoot: item.weakFootAbility || 0,
        height: item.height || 0,
        weight: item.weight || 0,
        birthdate: item.birthdate || '',
        alternatePositions: (item.alternatePositions || []).map((p: any) => p.shortLabel),
        playStyles: (item.playerAbilities || [])
          .filter((a: any) => a.type?.id === 'playStyle')
          .map((a: any) => ({ name: a.label, icon: a.imageUrl })),
        playStylesPlus: (item.playerAbilities || [])
          .filter((a: any) => a.type?.id === 'playStylePlus')
          .map((a: any) => ({ name: a.label, icon: a.imageUrl })),
      }));

    return new Response(JSON.stringify({
      players,
      total: data.totalItems,
      limit,
      offset,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
