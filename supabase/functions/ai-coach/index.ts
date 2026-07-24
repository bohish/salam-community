import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// ============================================================================
// Futmac AI Coach — data-grounded edge function.
// Uses OpenAI function calling to fetch real EA FC 26 player data from the
// MSMC public API before generating squad/analysis answers. The model is
// explicitly forbidden from inventing players, ratings, or prices.
// ============================================================================

const MSMC = 'https://api.msmc.cc/api/fc26';

const SYSTEM_PROMPT = `أنت "مدرب futmac" — مساعد ذكي متخصص في لعبة EA SPORTS FC 26.

قواعد صارمة (لا تكسرها أبداً):
1. لا تخترع أي لاعب، تقييم، مركز، نادي، أو سعر من عندك. كل معلومة عن لاعب يجب أن تأتي حرفياً من نتائج الأدوات (tools) التي تستدعيها.
2. قبل الإجابة على أي طلب يتعلق بلاعب/تشكيلة/مقارنة/ترقية/كيمياء، استدعِ الأدوات المتاحة لجلب البيانات الحقيقية من قاعدة اللاعبين.
3. إذا لم تُرجع الأداة اللاعب المطلوب، اذكر صراحةً: "لم أجد هذا اللاعب في قاعدة البيانات" — ولا تُخمّن.
4. لا تذكر أسعاراً رقمية إلا إذا وردت في نتائج الأدوات. إن لم تتوفر الأسعار، قل ذلك.
5. ردّ دائماً بالعربية الفصحى المبسّطة.

عند بناء تشكيلة:
- استخدم top_players و search_players لاختيار لاعبين حقيقيين مناسبين للمراكز والميزانية.
- ثم أعد الجواب بهذا التنسيق:
  • التشكيلة (Formation): مثل 4-3-3
  • الكيمياء المتوقعة: تقدير مختصر بناءً على تطابق الدوري/النادي/الجنسية من البيانات
  • السعر الإجمالي التقديري: إن لم تتوفر أسعار في البيانات، اكتب "غير متوفر"
  • قائمة اللاعبين: كل لاعب في سطر (المركز — الاسم — التقييم — النادي — الدولة)
  • ملاحظات موجزة: 2-4 نقاط تشرح سبب الاختيار

كن مختصراً، منظماً، ولا تخرج عن مجال FIFA/EA FC.`;

interface ChatMsg { role: 'user' | 'assistant' | 'tool' | 'system'; content: string | null; tool_calls?: any; tool_call_id?: string; name?: string }

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// ---------- Tool definitions exposed to OpenAI ----------
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_players',
      description: 'ابحث في قاعدة لاعبي EA FC 26 بالاسم. يعيد قائمة بأفضل النتائج مع التقييم والمركز والنادي والدولة.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'اسم اللاعب أو جزء منه' },
          limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_player',
      description: 'اجلب تفاصيل لاعب محدد بواسطة ID من قاعدة البيانات.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'top_players',
      description: 'اجلب أفضل اللاعبين تقييماً، مع فلاتر اختيارية للمركز والدولة والدوري.',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string', description: 'مثل ST, CAM, CB, GK' },
          nation: { type: 'string' },
          league: { type: 'string' },
          min_rating: { type: 'integer', minimum: 40, maximum: 99 },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
        },
      },
    },
  },
];

// ---------- Tool implementations (call MSMC public API) ----------
const trim = (p: any) => ({
  id: Number(p.ID),
  name: p.Name,
  rating: Number(p.OVR),
  position: p.Position,
  altPositions: p['Alternative positions'] ?? [],
  pace: Number(p.PAC), shooting: Number(p.SHO), passing: Number(p.PAS),
  dribbling: Number(p.DRI), defending: Number(p.DEF), physical: Number(p.PHY),
  weakFoot: Number(p['Weak foot']), skillMoves: Number(p['Skill moves']),
  foot: p['Preferred foot'], club: p.Team, nation: p.Nation, league: p.League,
  playStyles: p['play style'] ?? [],
});

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`upstream ${r.status}`);
  return r.json();
}

async function toolSearch(args: any) {
  try {
    const name = String(args.name ?? '').trim();
    const limit = Math.min(Number(args.limit ?? 5), 10);
    if (!name) return { error: 'name مطلوب' };
    const raw = await fetchJson(`${MSMC}/player/name/${encodeURIComponent(name)}`);
    const arr = Array.isArray(raw) ? raw : [raw];
    return { players: arr.slice(0, limit).map(trim) };
  } catch (e) {
    return { error: `لم أجد نتائج: ${(e as Error).message}` };
  }
}

async function toolGet(args: any) {
  try {
    const id = Number(args.id);
    if (!id) return { error: 'id مطلوب' };
    const p = await fetchJson(`${MSMC}/player/id/${id}`);
    return { player: trim(p) };
  } catch (e) {
    return { error: `تعذر جلب اللاعب: ${(e as Error).message}` };
  }
}

async function toolTop(args: any) {
  try {
    const limit = Math.min(Number(args.limit ?? 10), 20);
    const minRating = Number(args.min_rating ?? 0);
    const position = args.position ? String(args.position).toUpperCase() : null;
    const nation = args.nation ? String(args.nation).toLowerCase() : null;
    const league = args.league ? String(args.league).toLowerCase() : null;
    // MSMC has no bulk endpoint — pull top ranks in parallel (rank 1..scanSize).
    const scanSize = position || nation || league ? 150 : Math.max(limit * 3, 40);
    const ranks = Array.from({ length: scanSize }, (_, i) => i + 1);
    const settled = await Promise.all(
      ranks.map(async (r) => {
        try {
          const p = await fetchJson(`${MSMC}/player/rank/${r}`);
          return p && p.ID ? p : null;
        } catch { return null; }
      }),
    );
    const arr = settled.filter(Boolean).filter((p: any) => {
      if (minRating && Number(p.OVR) < minRating) return false;
      if (position) {
        const alt = Array.isArray(p['Alternative positions']) ? p['Alternative positions'].map((x: string) => String(x).toUpperCase()) : [];
        if (String(p.Position).toUpperCase() !== position && !alt.includes(position)) return false;
      }
      if (nation && !String(p.Nation ?? '').toLowerCase().includes(nation)) return false;
      if (league && !String(p.League ?? '').toLowerCase().includes(league)) return false;
      return true;
    });
    return { players: arr.slice(0, limit).map(trim) };
  } catch (e) {
    return { error: `تعذّر جلب القائمة: ${(e as Error).message}` };
  }
}

async function runTool(name: string, args: any) {
  switch (name) {
    case 'search_players': return toolSearch(args);
    case 'get_player': return toolGet(args);
    case 'top_players': return toolTop(args);
    default: return { error: `أداة غير معروفة: ${name}` };
  }
}

// ---------- OpenAI call with tool-calling loop ----------
async function callOpenAI(apiKey: string, messages: ChatMsg[]) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 900,
      tools,
      tool_choice: 'auto',
      messages,
    }),
  });
  return res;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return jsonRes({ error: 'OPENAI_API_KEY غير مضبوط في الخادم.' }, 500);

    const body = await req.json().catch(() => null);
    const raw = body?.messages;
    if (!Array.isArray(raw) || raw.length === 0) return jsonRes({ error: 'messages مطلوب.' }, 400);

    const history: ChatMsg[] = raw
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    const messages: ChatMsg[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

    // Tool-calling loop: allow up to 4 rounds so the model can chain lookups.
    for (let round = 0; round < 4; round++) {
      const res = await callOpenAI(apiKey, messages);
      if (!res.ok) {
        const errText = await res.text();
        console.error('OpenAI error:', res.status, errText);
        if (res.status === 429) return jsonRes({ error: 'تم تجاوز حد الطلبات. حاول بعد قليل.' }, 429);
        if (res.status === 401) return jsonRes({ error: 'مفتاح OpenAI غير صالح.' }, 500);
        return jsonRes({ error: 'فشل الاتصال بالذكاء الاصطناعي.' }, 502);
      }
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      if (!msg) return jsonRes({ error: 'رد فارغ من النموذج.' }, 502);

      const toolCalls = msg.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        // Push the assistant tool-call message, then each tool result.
        messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: toolCalls });
        for (const tc of toolCalls) {
          let args: any = {};
          try { args = JSON.parse(tc.function?.arguments ?? '{}'); } catch { /* noop */ }
          const result = await runTool(tc.function?.name, args);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function?.name,
            content: JSON.stringify(result).slice(0, 8000),
          });
        }
        continue; // ask model again with tool results
      }

      const reply = (msg.content ?? '').trim();
      if (!reply) return jsonRes({ error: 'رد فارغ من النموذج.' }, 502);
      return jsonRes({ reply });
    }

    return jsonRes({ error: 'تعذّر إنهاء المحادثة بعد عدة محاولات.' }, 502);
  } catch (e) {
    console.error('ai-coach error:', e);
    return jsonRes({ error: 'خطأ غير متوقع في الخادم.' }, 500);
  }
});
