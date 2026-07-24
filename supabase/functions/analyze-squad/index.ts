import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// ============================================================================
// Futmac "Analyze My Squad" — vision detection + grounded analysis.
// - detect: OpenAI vision reads the screenshot → structured player list →
//   each detection is fuzzy-matched against the real FUT.GG pool → returns
//   ordered slots with top-N candidates + auto-selected flag.
// - analyze: takes the built squad + budget + intent, gathers per-slot
//   candidates from the pool, and asks the model to return grounded JSON:
//   strengths / weaknesses / chemistry notes / tactics / upgrades /
//   cheaper alternatives / one-click swap sets keyed by intent.
// The model NEVER invents players — it can only reference IDs from
// candidates we already fetched from the pool.
// ============================================================================

const FUTGG_BASE = "https://www.fut.gg/api/fut/players/v2/26/";

const POSITIONS = ["GK","RB","LB","CB","RWB","LWB","CDM","CM","CAM","LM","RM","LW","RW","ST","CF"] as const;
type Position = typeof POSITIONS[number];

const POSITION_ALIASES: Record<string, Position> = {
  gk: "GK", goalkeeper: "GK",
  rb: "RB", "right back": "RB",
  lb: "LB", "left back": "LB",
  cb: "CB", defender: "CB", "centre back": "CB", "center back": "CB",
  rwb: "RWB", lwb: "LWB",
  cdm: "CDM", dm: "CDM", "defensive mid": "CDM",
  cm: "CM", midfielder: "CM",
  cam: "CAM", "attacking mid": "CAM",
  lm: "LM", rm: "RM",
  lw: "LW", "left wing": "LW",
  rw: "RW", "right wing": "RW",
  st: "ST", striker: "ST",
  cf: "CF",
};
function normalizePosition(input: unknown): Position | null {
  if (input == null) return null;
  const k = String(input).trim();
  if (!k) return null;
  const up = k.toUpperCase();
  if ((POSITIONS as readonly string[]).includes(up)) return up as Position;
  return POSITION_ALIASES[k.toLowerCase()] ?? null;
}

// ---------- FUT.GG pool with in-memory cache ----------
interface FGPlayer {
  eaId: number; basePlayerEaId?: number; overall: number;
  position: string; alternativePositions?: string[] | null;
  price?: number | null; cardName?: string | null; commonName?: string | null;
  firstName?: string; lastName?: string;
  club?: { name?: string } | null; nation?: { name?: string } | null; league?: { name?: string } | null;
  rarityName?: string; isSpecial?: boolean; isIcon?: boolean; isHero?: boolean;
  cardImageUrl?: string | null; imageUrl?: string | null; simpleCardImageUrl?: string | null;
}
let POOL_CACHE: { at: number; players: FGPlayer[] } | null = null;
const POOL_TTL_MS = 5 * 60 * 1000;
const POOL_PAGES = 10;
async function fetchPage(page: number): Promise<FGPlayer[]> {
  const r = await fetch(`${FUTGG_BASE}?sort=-overall&page=${page}`, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (futmac-analyze/1.0)" },
  });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  return Array.isArray(j?.data) ? (j.data as FGPlayer[]) : [];
}
async function getPool(): Promise<FGPlayer[]> {
  if (POOL_CACHE && Date.now() - POOL_CACHE.at < POOL_TTL_MS) return POOL_CACHE.players;
  const pages = await Promise.all(Array.from({ length: POOL_PAGES }, (_, i) => fetchPage(i + 1)));
  const seen = new Set<number>();
  const players: FGPlayer[] = [];
  for (const arr of pages) for (const p of arr) {
    if (!p.eaId || seen.has(p.eaId)) continue;
    seen.add(p.eaId); players.push(p);
  }
  POOL_CACHE = { at: Date.now(), players };
  console.log("[pool] loaded %d players", players.length);
  return players;
}
function playerPositions(p: FGPlayer): Position[] {
  const main = normalizePosition(p.position);
  const alts = Array.isArray(p.alternativePositions)
    ? p.alternativePositions.map(normalizePosition) : [];
  return [main, ...alts].filter(Boolean) as Position[];
}
function displayName(p: FGPlayer): string {
  return p.commonName || p.cardName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || `#${p.eaId}`;
}
function shape(p: FGPlayer) {
  return {
    id: p.eaId,
    name: displayName(p),
    rating: p.overall,
    position: normalizePosition(p.position) ?? p.position,
    altPositions: (Array.isArray(p.alternativePositions) ? p.alternativePositions : [])
      .map((x) => normalizePosition(x) ?? x),
    club: p.club?.name ?? null,
    nation: p.nation?.name ?? null,
    league: p.league?.name ?? null,
    price: typeof p.price === "number" ? p.price : null,
    cardUrl: p.cardImageUrl || p.imageUrl || p.simpleCardImageUrl || null,
    isSpecial: !!(p.isSpecial || p.isIcon || p.isHero),
    rarity: p.rarityName ?? null,
  };
}

// ---------- Fuzzy name match ----------
function norm(s: string): string {
  return (s || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(s: string): string[] { return norm(s).split(" ").filter(Boolean); }
function isSubseq(needle: string, hay: string): boolean {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) if (hay[j] === needle[i]) i++;
  return i === needle.length;
}
function scoreMatch(p: FGPlayer, q: string): number {
  const name = norm(displayName(p));
  const nameToks = tokens(displayName(p));
  const qn = norm(q);
  const qToks = tokens(q);
  if (!qToks.length) return 0;
  if (name === qn) return 1.0;
  if (nameToks[nameToks.length - 1] === qn) return 0.95;
  if (nameToks.includes(qn)) return 0.9;
  if (qToks.every((t) => nameToks.includes(t))) return 0.88;
  if (nameToks.some((w) => w.startsWith(qn))) return 0.75;
  if (name.startsWith(qn)) return 0.7;
  if (name.includes(qn)) return 0.6;
  if (qn.length >= 3 && isSubseq(qn, name)) return 0.35;
  return 0;
}

interface Detection {
  position?: string | null; name: string;
  rating?: number | null; club?: string | null; nation?: string | null;
  cardName?: string | null; confidence?: number | null;
}
function resolveCandidates(pool: FGPlayer[], d: Detection, position: Position | null, topN = 5) {
  const scored: { p: FGPlayer; s: number }[] = [];
  for (const p of pool) {
    let s = scoreMatch(p, d.name);
    if (s <= 0) continue;
    // Boost matches whose position aligns with detection
    if (position && playerPositions(p).includes(position)) s += 0.05;
    // Boost when rating is close to detected rating
    if (d.rating && Math.abs(p.overall - d.rating) <= 1) s += 0.06;
    else if (d.rating && Math.abs(p.overall - d.rating) <= 3) s += 0.03;
    // Boost when club matches
    if (d.club && p.club?.name && norm(p.club.name).includes(norm(d.club))) s += 0.05;
    if (d.nation && p.nation?.name && norm(p.nation.name).includes(norm(d.nation))) s += 0.03;
    scored.push({ p, s: Math.min(s, 1.0) });
  }
  scored.sort((a, b) => b.s - a.s);
  const seen = new Set<number>();
  const out: { player: ReturnType<typeof shape>; matchConfidence: number }[] = [];
  for (const { p, s } of scored) {
    if (seen.has(p.eaId)) continue;
    seen.add(p.eaId);
    out.push({ player: shape(p), matchConfidence: Number(s.toFixed(3)) });
    if (out.length >= topN) break;
  }
  return out;
}

// ---------- Vision (OpenAI gpt-4o-mini) ----------
const VISION_SYSTEM = `You extract FIFA / EA SPORTS FC squad information from a single screenshot (from EA FC in-game Ultimate Team, FUTBIN, or Futmac).
Return STRICT JSON only, no markdown, matching this schema:
{
  "formation": "4-3-3" | "4-2-3-1" | "4-4-2" | "3-4-3" | "3-5-2" | "4-3-2-1" | null,
  "players": [
    { "position": "GK|RB|LB|CB|RWB|LWB|CDM|CM|CAM|LM|RM|LW|RW|ST|CF",
      "name": "string as printed on card",
      "rating": number|null,
      "club": string|null,
      "nation": string|null,
      "cardName": string|null,
      "confidence": number between 0 and 1 }
  ]
}
Order the "players" array by pitch position: goalkeeper last, back row first (defenders), then midfielders, then attackers. Read names exactly as printed (Latin script if possible). If unsure of any field, use null. If the image is clearly not a football squad, return {"formation":null,"players":[]}.`;

async function detectFromImage(apiKey: string, imageDataUrl: string, formationHint?: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: VISION_SYSTEM },
        { role: "user", content: [
          { type: "text", text: formationHint
              ? `Formation hint from user: ${formationHint}. Extract every visible player card.`
              : "Extract every visible player card." },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
        ]},
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[vision] %d %s", res.status, errText.slice(0, 400));
    if (res.status === 429) throw new Error("تم تجاوز حد الطلبات، حاول بعد قليل.");
    if (res.status === 402) throw new Error("رصيد OpenAI غير كافٍ.");
    if (res.status === 400 && /image/i.test(errText)) throw new Error("لم يتمكن النموذج من قراءة الصورة. جرّب صورة أوضح.");
    throw new Error("فشل استخراج اللاعبين من الصورة.");
  }
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(text);
    const players: Detection[] = Array.isArray(parsed?.players) ? parsed.players : [];
    return {
      formation: typeof parsed?.formation === "string" ? parsed.formation : null,
      players,
    };
  } catch (e) {
    console.error("[vision] JSON parse fail", (e as Error).message);
    return { formation: null, players: [] as Detection[] };
  }
}

// ---------- Analysis prompt ----------
const ANALYSIS_SYSTEM = `أنت "مدرب futmac" — محلل تشكيلات FC 26 محترف.
تلتزم بقواعد صارمة:
1. لا تخترع أي لاعب. أي "suggestedId" أو "playerId" يجب أن يكون من قائمة candidatesByPosition المُرفقة أو من squad الحالي.
2. اعتمد فقط على البيانات المعطاة (أرقام التقييم/السعر/النادي/الدولة/الدوري).
3. اذكر الأسعار فقط إن كانت موجودة (price != null). لا تستنتج أسعاراً.
4. أعِد JSON صالحاً حرفياً بلا نص إضافي بالشكل:
{
  "summary": "جملة أو اثنتان بالعربية",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "chemistry": { "current": number, "target": number, "notes": ["..."] },
  "tactics": ["..."],
  "upgrades": [ { "slotId": "string", "reason": "بالعربية", "suggestedId": number, "deltaRating": number, "deltaPrice": number|null } ],
  "cheaperAlternatives": [ { "slotId": "string", "suggestedId": number, "savings": number|null, "reason": "بالعربية" } ],
  "actions": {
    "improveChem": [ { "slotId": "string", "suggestedId": number } ],
    "upgradeAttack": [ { "slotId": "string", "suggestedId": number } ],
    "replaceWeakest": { "slotId": "string", "suggestedId": number } | null,
    "optimizeBudget": [ { "slotId": "string", "suggestedId": number } ]
  }
}
5. إن لم يكن هناك اقتراح مناسب لأي قسم اترك المصفوفة فارغة أو null. لا تضف حقولاً أخرى.
6. ركّز التحليل على intent المُحدد: general/chem/attack/weakest/budget.`;

async function runAnalysis(apiKey: string, payload: unknown) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[analysis] %d %s", res.status, t.slice(0, 400));
    if (res.status === 429) throw new Error("تم تجاوز حد الطلبات، حاول بعد قليل.");
    if (res.status === 402) throw new Error("رصيد OpenAI غير كافٍ.");
    throw new Error("فشل تحليل التشكيلة.");
  }
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(text); } catch { return {}; }
}

// ---------- Chemistry (simple approximation, mirrors client) ----------
function calcChem(slots: { player: { club?: string|null; nation?: string|null; league?: string|null; position?: string; } | null; position?: string }[]) {
  const clubs = new Map<string, number>(), leagues = new Map<string, number>(), nations = new Map<string, number>();
  for (const s of slots) {
    const p = s.player; if (!p) continue;
    if (p.club) clubs.set(p.club, (clubs.get(p.club) ?? 0) + 1);
    if (p.league) leagues.set(p.league, (leagues.get(p.league) ?? 0) + 1);
    if (p.nation) nations.set(p.nation, (nations.get(p.nation) ?? 0) + 1);
  }
  let team = 0;
  for (const s of slots) {
    const p = s.player; if (!p) continue;
    const cc = p.club ? (clubs.get(p.club) ?? 0) : 0;
    const nc = p.nation ? (nations.get(p.nation) ?? 0) : 0;
    const lc = p.league ? (leagues.get(p.league) ?? 0) : 0;
    let pts = 0;
    if (cc >= 7) pts = 3; else if (cc >= 4) pts = 2; else if (cc >= 2) pts = 1;
    let np = 0;
    if (nc >= 8) np = 3; else if (nc >= 5) np = 2; else if (nc >= 2) np = 1;
    let lp = 0;
    if (lc >= 8) lp = 3; else if (lc >= 5) lp = 2; else if (lc >= 3) lp = 1;
    team += Math.min(3, pts + np + lp);
  }
  return Math.min(33, team);
}

// ---------- HTTP ----------
const jsonRes = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonRes({ error: "OPENAI_API_KEY غير مضبوط في الخادم." }, 500);
    const body = await req.json().catch(() => null);
    const action = body?.action;

    // ---------- DETECT ----------
    if (action === "detect") {
      const image = String(body?.image ?? "");
      if (!image.startsWith("data:image/")) return jsonRes({ error: "الصورة مطلوبة بصيغة data URL." }, 400);
      if (image.length > 6 * 1024 * 1024) return jsonRes({ error: "حجم الصورة كبير جداً (الحد الأقصى ~4MB)." }, 413);
      const formationHint = typeof body?.formationHint === "string" ? body.formationHint : undefined;

      const [detection, pool] = await Promise.all([
        detectFromImage(apiKey, image, formationHint),
        getPool(),
      ]);
      console.log("[detect] formation=%s players=%d", detection.formation, detection.players.length);

      const slots = detection.players.map((d, idx) => {
        const pos = normalizePosition(d.position ?? "") ?? null;
        const cands = resolveCandidates(pool, d, pos, 5);
        const top = cands[0];
        const gap = cands.length > 1 ? (top.matchConfidence - cands[1].matchConfidence) : 1;
        const autoSelect = !!top && top.matchConfidence >= 0.85 && gap >= 0.15;
        return {
          slotIndex: idx,
          position: pos ?? d.position ?? null,
          detected: { name: d.name, rating: d.rating ?? null, club: d.club ?? null, nation: d.nation ?? null, confidence: d.confidence ?? null },
          candidates: cands,
          autoSelected: autoSelect ? top.player : null,
          needsConfirmation: !autoSelect,
        };
      });

      return jsonRes({
        formation: detection.formation,
        slots,
        poolSize: pool.length,
      });
    }

    // ---------- ANALYZE ----------
    if (action === "analyze") {
      const squad = body?.squad;
      if (!squad || !Array.isArray(squad.slots)) return jsonRes({ error: "squad مطلوب." }, 400);
      const budget: number | undefined = typeof body?.budget === "number" ? body.budget : undefined;
      const intent: string = typeof body?.intent === "string" ? body.intent : "general";

      const pool = await getPool();
      // Build candidate map per slot (filtered by budget if provided)
      const candidatesByPosition: Record<string, ReturnType<typeof shape>[]> = {};
      for (const s of squad.slots) {
        const pos = normalizePosition(s.position);
        if (!pos) continue;
        if (candidatesByPosition[s.id]) continue;
        const list = pool
          .filter((p) => playerPositions(p).includes(pos))
          .filter((p) => budget == null || typeof p.price !== "number" || p.price <= budget)
          .sort((a, b) => b.overall - a.overall)
          .slice(0, 8)
          .map(shape);
        candidatesByPosition[s.id] = list;
      }

      const ratings = squad.slots.map((s: any) => s.player?.rating).filter((x: any) => typeof x === "number");
      const currentRating = ratings.length ? Math.round(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : 0;
      const currentPrice = squad.slots.reduce((t: number, s: any) => t + (typeof s.player?.price === "number" ? s.player.price : 0), 0);
      const currentChem = calcChem(squad.slots);

      const payload = {
        intent,
        budget: budget ?? null,
        formation: squad.formation,
        currentRating,
        currentPrice,
        currentChem,
        squad: squad.slots.map((s: any) => ({
          slotId: s.id,
          position: s.position,
          player: s.player ? {
            id: s.player.id, name: s.player.name, rating: s.player.rating,
            club: s.player.club, nation: s.player.nation, league: s.player.league,
            price: s.player.price, isSpecial: !!s.player.isSpecial,
          } : null,
        })),
        candidatesByPosition,
      };

      const analysis = await runAnalysis(apiKey, payload);

      // Enrich suggestions with full player data (server-side, from pool only)
      const idToPlayer = new Map<number, ReturnType<typeof shape>>();
      for (const list of Object.values(candidatesByPosition)) for (const p of list) idToPlayer.set(p.id, p);
      const enrich = (id: unknown) => (typeof id === "number" ? idToPlayer.get(id) ?? null : null);

      const enrichArr = (arr: any) => Array.isArray(arr)
        ? arr.map((x) => ({ ...x, player: enrich(x?.suggestedId) })).filter((x) => x.player)
        : [];
      const enrichOne = (obj: any) => (obj && enrich(obj.suggestedId) ? { ...obj, player: enrich(obj.suggestedId) } : null);

      const enriched = {
        summary: typeof analysis.summary === "string" ? analysis.summary : "",
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
        weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
        chemistry: analysis.chemistry ?? { current: currentChem, target: 33, notes: [] },
        tactics: Array.isArray(analysis.tactics) ? analysis.tactics : [],
        upgrades: enrichArr(analysis.upgrades),
        cheaperAlternatives: enrichArr(analysis.cheaperAlternatives),
        actions: {
          improveChem: enrichArr(analysis?.actions?.improveChem),
          upgradeAttack: enrichArr(analysis?.actions?.upgradeAttack),
          replaceWeakest: enrichOne(analysis?.actions?.replaceWeakest),
          optimizeBudget: enrichArr(analysis?.actions?.optimizeBudget),
        },
        stats: { rating: currentRating, price: currentPrice, chem: currentChem, filled: squad.slots.filter((s: any) => s.player).length },
      };

      return jsonRes(enriched);
    }

    return jsonRes({ error: `action غير معروف: ${action}` }, 400);
  } catch (e) {
    console.error("analyze-squad error:", e);
    return jsonRes({ error: (e as Error).message || "خطأ غير متوقع" }, 500);
  }
});
