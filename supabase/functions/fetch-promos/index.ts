const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const today = new Date().toISOString().split('T')[0];

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an EA FC 26 Ultimate Team expert. Return JSON only, no markdown. Today is ${today}.`
          },
          {
            role: 'user',
            content: `Give me the current and recent EA FC 26 Ultimate Team promos and events. Include:
1. Current active promo (name, description, dates, key players with ratings)
2. Recent promos from the last 2 weeks
3. Upcoming promos if known

Return as JSON with this structure:
{
  "currentPromo": {
    "name": "string",
    "nameAr": "string (Arabic name)",
    "description": "string",
    "descriptionAr": "string (Arabic)",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "color": "hex color for the promo theme",
    "players": [
      {
        "name": "string",
        "rating": number,
        "position": "string",
        "club": "string",
        "nation": "string",
        "isNew": boolean
      }
    ]
  },
  "recentPromos": [
    {
      "name": "string",
      "nameAr": "string",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "color": "hex",
      "playerCount": number,
      "topPlayer": { "name": "string", "rating": number }
    }
  ],
  "upcomingPromos": [
    {
      "name": "string",
      "nameAr": "string",
      "expectedDate": "string",
      "description": "string"
    }
  ],
  "totw": {
    "week": number,
    "players": [
      { "name": "string", "rating": number, "position": "string", "club": "string" }
    ]
  }
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Try to parse as JSON, handling potential markdown wrappers
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { error: 'Failed to parse AI response', raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
