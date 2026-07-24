import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// ============================================================================
// Futmac AI Coach — grounded on real FC 26 card data.
// Pool source: FUT.GG top-rated pages (bulk, cheap, includes price + alt pos).
// Detail/name lookups: MSMC public API.
// The model must call tools; it is forbidden from inventing players/prices.
// ============================================================================

const MSMC = 'https://api.msmc.cc/api/fc26';
const FUTGG_BASE = 'https://www.fut.gg/api/fut/players/v2/26/';

// ---------- Position normalization ----------
const POSITIONS = ['GK','RB','LB','CB','RWB','LWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF'] as const;
type Position = typeof POSITIONS[number];

const POSITION_ALIASES: Record<string, Position> = {
  gk: 'GK', goalkeeper: 'GK', حارس: 'GK', 'حارس مرمى': 'GK',
  rb: 'RB', 'ظهير أيمن': 'RB', 'ظهير ايمن': 'RB',
  lb: 'LB', 'ظهير أيسر': 'LB', 'ظهير ايسر': 'LB',
  cb: 'CB', 'قلب دفاع': 'CB', مدافع: 'CB', defender: 'CB',
  rwb: 'RWB', lwb: 'LWB',
  cdm: 'CDM', 'وسط دفاعي': 'CDM', dm: 'CDM',
  cm: 'CM', وسط: 'CM', midfielder: 'CM',
  cam: 'CAM', 'صانع ألعاب': 'CAM', 'صانع العاب': 'CAM',
  lm: 'LM', 'جناح أيسر وسط': 'LM',
  rm: 'RM', 'جناح أيمن وسط': 'RM',
  lw: 'LW', 'جناح أيسر': 'LW', 'جناح ايسر': 'LW',
  rw: 'RW', 'جناح أيمن': 'RW', 'جناح ايمن': 'RW',
  st: 'ST', مهاجم: 'ST', 'رأس حربة': 'ST', 'راس حربة': 'ST', striker: 'ST', forward: 'ST',
  cf: 'CF', 'مهاجم متمركز': 'CF',
};

function normalizePosition(input: unknown): Position | null {
  if (input == null) return null;
  const k = String(input).trim().toLowerCase();
  if (!k) return null;
  const up = k.toUpperCase();
  if ((POSITIONS as readonly string[]).includes(up)) return up as Position;
  return POSITION_ALIASES[k] ?? POSITION_ALIASES[up.toLowerCase()] ?? null;
}

function playerPositions(p: any): Position[] {
  const main = normalizePosition(p.position);
  const alts = Array.isArray(p.alternativePositions ?? p['Alternative positions'])
    ? (p.alternativePositions ?? p['Alternative positions']).map(normalizePosition)
    : [];
  return [main, ...alts].filter(Boolean) as Position[];
}

// ---------- FUT.GG pool with in-memory cache ----------
interface FGPlayer {
  eaId: number; basePlayerEaId?: number; overall: number;
  position: string; alternativePositions?: string[] | null;
  price?: number | null; cardName?: string | null; commonName?: string | null;
  firstName?: string; lastName?: string;
  club?: { name?: string } | null; nation?: { name?: string } | null; league?: { name?: string } | null;
  rarityName?: string; isSpecial?: boolean; isIcon?: boolean; isHero?: boolean;
}

let POOL_CACHE: { at: number; players: FGPlayer[] } | null = null;
const POOL_TTL_MS = 5 * 60 * 1000;
const POOL_PAGES = 8; // ~200 top-rated cards

async function fetchFutggPage(page: number): Promise<FGPlayer[]> {
  const url = `${FUTGG_BASE}?sort=-overall&page=${page}`;
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; futmac-coach/1.0)' },
  });
  if (!r.ok) { console.warn('[futgg] page %d failed %d', page, r.status); return []; }
  const j = await r.json().catch(() => null);
  return Array.isArray(j?.data) ? j.data as FGPlayer[] : [];
}

async function getPool(): Promise<FGPlayer[]> {
  if (POOL_CACHE && Date.now() - POOL_CACHE.at < POOL_TTL_MS) return POOL_CACHE.players;
  const pages = await Promise.all(Array.from({ length: POOL_PAGES }, (_, i) => fetchFutggPage(i + 1)));
  const seen = new Set<number>();
  const players: FGPlayer[] = [];
  for (const arr of pages) for (const p of arr) {
    const id = p.basePlayerEaId ?? p.eaId;
    if (!id || seen.has(id)) continue;
    seen.add(id); players.push(p);
  }
  POOL_CACHE = { at: Date.now(), players };
  console.log('[pool] loaded %d players across %d pages', players.length, POOL_PAGES);
  // Debug: per-position counts so we can verify coverage in logs.
  const counts: Record<string, number> = {};
  for (const p of players) for (const pos of playerPositions(p)) counts[pos] = (counts[pos] ?? 0) + 1;
  console.log('[pool] position coverage %s', JSON.stringify(counts));
  return players;
}

function displayName(p: FGPlayer): string {
  return p.commonName || p.cardName || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `#${p.eaId}`;
}

function shape(p: FGPlayer) {
  return {
    id: p.basePlayerEaId ?? p.eaId,
    name: displayName(p),
    rating: p.overall,
    position: normalizePosition(p.position) ?? p.position,
    altPositions: playerPositions(p).slice(1),
    club: p.club?.name ?? null,
    nation: p.nation?.name ?? null,
    league: p.league?.name ?? null,
    price: typeof p.price === 'number' ? p.price : null,
    rarity: p.rarityName ?? null,
    isSpecial: !!(p.isSpecial || p.isIcon || p.isHero),
  };
}

// ---------- Tools ----------
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_players',
      description: 'ابحث بالاسم في قاعدة MSMC. يعيد اللاعبين المطابقين مع مركزهم وتقييمهم.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 } },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_player',
      description: 'اجلب تفاصيل لاعب بواسطة EA ID.',
      parameters: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'top_players',
      description: 'أفضل اللاعبين من قاعدة FUT.GG مع فلاتر (مركز واحد، دولة، دوري، حد أدنى للتقييم، حد أعلى للسعر). المراكز المدعومة: GK, RB, LB, CB, RWB, LWB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF.',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string' },
          nation: { type: 'string' },
          league: { type: 'string' },
          min_rating: { type: 'integer', minimum: 40, maximum: 99 },
          max_price: { type: 'integer', minimum: 0 },
          limit: { type: 'integer', minimum: 1, maximum: 25, default: 10 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'squad_candidates',
      description: 'استخدم هذه لبناء تشكيلة كاملة: تعيد أفضل المرشحين لكل مركز مطلوب دفعة واحدة. مفضّل على استدعاء top_players 11 مرة.',
      parameters: {
        type: 'object',
        properties: {
          positions: { type: 'array', items: { type: 'string' }, description: 'قائمة المراكز بترتيبها في التشكيلة، مثل ["GK","RB","CB","CB","LB","CDM","CM","CAM","RW","ST","LW"]' },
          per_position: { type: 'integer', minimum: 1, maximum: 6, default: 3 },
          min_rating: { type: 'integer', minimum: 40, maximum: 99 },
          max_price: { type: 'integer', minimum: 0 },
          nation: { type: 'string' },
          league: { type: 'string' },
        },
        required: ['positions'],
      },
    },
  },
];

// ---------- Tool implementations ----------
const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function toolSearchMsmc(args: any) {
  const name = String(args?.name ?? '').trim();
  const limit = Math.min(Number(args?.limit ?? 5) || 5, 10);
  if (!name) return { error: 'name مطلوب', players: [] };
  try {
    const r = await fetch(`${MSMC}/player/name/${encodeURIComponent(name)}`);
    if (!r.ok) { console.warn('[search] msmc %d for %s', r.status, name); return { players: [], note: 'لم أجد نتائج في قاعدة البيانات.' }; }
    const raw = await r.json();
    const arr = Array.isArray(raw) ? raw : [raw];
    const players = arr.filter(Boolean).slice(0, limit).map((p: any) => ({
      id: Number(p.ID), name: p.Name, rating: Number(p.OVR),
      position: normalizePosition(p.Position) ?? p.Position,
      altPositions: (p['Alternative positions'] ?? []).map((x: string) => normalizePosition(x) ?? x),
      club: p.Team, nation: p.Nation, league: p.League,
    }));
    console.log('[search] name=%s → %d results', name, players.length);
    return { players, count: players.length };
  } catch (e) {
    console.error('[search] error', (e as Error).message);
    return { players: [], error: 'تعذّر البحث حالياً.' };
  }
}

async function toolGetMsmc(args: any) {
  const id = Number(args?.id);
  if (!id) return { error: 'id مطلوب' };
  try {
    const r = await fetch(`${MSMC}/player/id/${id}`);
    if (!r.ok) return { error: `لم يُعثر على اللاعب ${id} في قاعدة البيانات.` };
    const p = await r.json();
    if (!p?.ID) return { error: `لم يُعثر على اللاعب ${id}.` };
    return {
      player: {
        id: Number(p.ID), name: p.Name, rating: Number(p.OVR),
        position: normalizePosition(p.Position) ?? p.Position,
        altPositions: (p['Alternative positions'] ?? []).map((x: string) => normalizePosition(x) ?? x),
        club: p.Team, nation: p.Nation, league: p.League,
        pace: Number(p.PAC), shooting: Number(p.SHO), passing: Number(p.PAS),
        dribbling: Number(p.DRI), defending: Number(p.DEF), physical: Number(p.PHY),
        weakFoot: Number(p['Weak foot']), skillMoves: Number(p['Skill moves']),
        foot: p['Preferred foot'],
      },
    };
  } catch (e) {
    console.error('[get] error', (e as Error).message);
    return { error: 'تعذّر جلب اللاعب حالياً.' };
  }
}

function filterPool(
  pool: FGPlayer[],
  opts: { position?: Position | null; nation?: string | null; league?: string | null; minRating?: number; maxPrice?: number },
) {
  const nation = opts.nation?.toLowerCase() || null;
  const league = opts.league?.toLowerCase() || null;
  let dropped = { rating: 0, position: 0, nation: 0, league: 0, price: 0 };
  const kept = pool.filter((p) => {
    if (opts.minRating && p.overall < opts.minRating) { dropped.rating++; return false; }
    if (opts.position) {
      const pos = playerPositions(p);
      if (!pos.includes(opts.position)) { dropped.position++; return false; }
    }
    if (nation && !(p.nation?.name ?? '').toLowerCase().includes(nation)) { dropped.nation++; return false; }
    if (league && !(p.league?.name ?? '').toLowerCase().includes(league)) { dropped.league++; return false; }
    if (opts.maxPrice != null && typeof p.price === 'number' && p.price > opts.maxPrice) { dropped.price++; return false; }
    return true;
  });
  return { kept, dropped };
}

async function toolTopPlayers(args: any) {
  const pool = await getPool();
  const rawPos = args?.position;
  const position = rawPos ? normalizePosition(rawPos) : null;
  if (rawPos && !position) {
    console.warn('[top_players] unknown position "%s"', rawPos);
    return { players: [], note: `المركز "${rawPos}" غير معروف. المراكز المدعومة: ${POSITIONS.join(', ')}.` };
  }
  const limit = Math.min(Number(args?.limit ?? 10) || 10, 25);
  const { kept, dropped } = filterPool(pool, {
    position, nation: args?.nation, league: args?.league,
    minRating: Number(args?.min_rating) || undefined,
    maxPrice: args?.max_price != null ? Number(args.max_price) : undefined,
  });
  const sorted = kept.sort((a, b) => b.overall - a.overall).slice(0, limit).map(shape);
  console.log('[top_players] pos=%s kept=%d dropped=%s returned=%d', position ?? '-', kept.length, JSON.stringify(dropped), sorted.length);
  if (sorted.length === 0) {
    return {
      players: [],
      note: `لم يتم العثور على لاعبين مطابقين لهذه الفلاتر ضمن قاعدة البيانات الحالية (${pool.length} لاعب متوفر).`,
      dropped_by: dropped,
    };
  }
  return { players: sorted, count: sorted.length, pool_size: pool.length };
}

async function toolSquadCandidates(args: any) {
  const pool = await getPool();
  const requested: string[] = Array.isArray(args?.positions) ? args.positions : [];
  if (requested.length === 0) return { error: 'positions مطلوبة (مصفوفة مراكز).', slots: [] };
  const perPos = Math.min(Number(args?.per_position ?? 3) || 3, 6);
  const minRating = Number(args?.min_rating) || undefined;
  const maxPrice = args?.max_price != null ? Number(args.max_price) : undefined;
  const nation = args?.nation ?? undefined;
  const league = args?.league ?? undefined;

  const slots = requested.map((raw, idx) => {
    const pos = normalizePosition(raw);
    if (!pos) {
      console.warn('[squad] slot %d: unknown position "%s"', idx, raw);
      return { slot: idx + 1, requested: raw, position: null, candidates: [], note: `مركز غير معروف: ${raw}` };
    }
    const { kept, dropped } = filterPool(pool, { position: pos, nation, league, minRating, maxPrice });
    const candidates = kept.sort((a, b) => b.overall - a.overall).slice(0, perPos).map(shape);
    console.log('[squad] slot %d pos=%s candidates=%d dropped=%s', idx + 1, pos, candidates.length, JSON.stringify(dropped));
    return {
      slot: idx + 1, requested: raw, position: pos,
      candidates,
      ...(candidates.length === 0 ? { note: 'لا يوجد لاعبون مطابقون لهذا المركز ضمن الفلاتر.', dropped_by: dropped } : {}),
    };
  });

  const missing = slots.filter((s) => s.candidates.length === 0).map((s) => s.position ?? s.requested);
  return { pool_size: pool.length, slots, missing_positions: missing };
}

async function runTool(name: string, args: any) {
  switch (name) {
    case 'search_players': return toolSearchMsmc(args);
    case 'get_player': return toolGetMsmc(args);
    case 'top_players': return toolTopPlayers(args);
    case 'squad_candidates': return toolSquadCandidates(args);
    default: return { error: `أداة غير معروفة: ${name}` };
  }
}

// ---------- System prompt ----------
const SYSTEM_PROMPT = `أنت "مدرب futmac" — مساعد ذكي متخصص في EA SPORTS FC 26.

قواعد صارمة:
1. لا تخترع أي لاعب/تقييم/مركز/نادي/سعر. كل معلومة عن لاعب يجب أن تأتي حرفياً من نتائج الأدوات.
2. قبل أي إجابة عن لاعب/تشكيلة/مقارنة/ترقية/كيمياء استدعِ الأدوات لجلب البيانات.
3. لبناء تشكيلة كاملة استدعِ squad_candidates مرة واحدة بقائمة المراكز — لا تستدعِ top_players 11 مرة.
4. إن أعادت الأداة "note" يشير إلى عدم وجود نتائج (أو missing_positions ليست فارغة)، اذكر ذلك صراحةً ولا تُخمّن.
5. لا تذكر أسعاراً إلا إذا وردت في الحقل price. إن كانت null اكتب "السعر غير متوفر".
6. ردّ بالعربية الفصحى المبسّطة، منظماً ومختصراً.

المراكز المدعومة: GK, RB, LB, CB, RWB, LWB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF.

عند بناء تشكيلة أعد النتيجة بهذا الشكل:
• التشكيلة (Formation)
• الكيمياء المتوقعة (تقدير مختصر بناءً على تطابق الدوري/النادي/الجنسية من البيانات)
• السعر الإجمالي التقديري (اجمع الأسعار المتوفرة فقط؛ اذكر عدد اللاعبين بلا سعر)
• قائمة اللاعبين: المركز — الاسم — التقييم — النادي — الدولة — السعر
• ملاحظات موجزة (2-4 نقاط)`;

// ---------- OpenAI loop ----------
interface ChatMsg { role: 'user' | 'assistant' | 'tool' | 'system'; content: string | null; tool_calls?: any; tool_call_id?: string; name?: string }

async function callOpenAI(apiKey: string, messages: ChatMsg[]) {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1100,
      tools,
      tool_choice: 'auto',
      messages,
    }),
  });
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

    for (let round = 0; round < 5; round++) {
      const res = await callOpenAI(apiKey, messages);
      if (!res.ok) {
        const errText = await res.text();
        console.error('OpenAI %d: %s', res.status, errText.slice(0, 500));
        if (res.status === 429) return jsonRes({ error: 'تم تجاوز حد الطلبات. حاول بعد قليل.' }, 429);
        if (res.status === 401) return jsonRes({ error: 'مفتاح OpenAI غير صالح.' }, 500);
        return jsonRes({ error: 'فشل الاتصال بالذكاء الاصطناعي.' }, 502);
      }
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      if (!msg) return jsonRes({ error: 'رد فارغ من النموذج.' }, 502);

      const toolCalls = msg.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: toolCalls });
        for (const tc of toolCalls) {
          let args: any = {};
          try { args = JSON.parse(tc.function?.arguments ?? '{}'); } catch { /* noop */ }
          console.log('[tool] %s args=%s', tc.function?.name, JSON.stringify(args).slice(0, 300));
          const result = await runTool(tc.function?.name, args);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function?.name,
            content: JSON.stringify(result).slice(0, 12000),
          });
        }
        continue;
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
