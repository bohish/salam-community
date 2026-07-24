import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// ============================================================================
// Futmac Squad Builder — deterministic pitch filler grounded in FUT.GG data.
// - The client picks a formation & optional filters, or issues a natural
//   command that OpenAI parses into a structured action.
// - This function ALWAYS builds the squad server-side from the real player
//   pool; the model never invents cards, prices, or ratings.
// ============================================================================

const FUTGG_BASE = "https://www.fut.gg/api/fut/players/v2/26/";

const POSITIONS = ["GK","RB","LB","CB","RWB","LWB","CDM","CM","CAM","LM","RM","LW","RW","ST","CF"] as const;
type Position = typeof POSITIONS[number];

const POSITION_ALIASES: Record<string, Position> = {
  gk: "GK", goalkeeper: "GK", حارس: "GK", "حارس مرمى": "GK",
  rb: "RB", "ظهير أيمن": "RB", "ظهير ايمن": "RB",
  lb: "LB", "ظهير أيسر": "LB", "ظهير ايسر": "LB",
  cb: "CB", "قلب دفاع": "CB", مدافع: "CB",
  rwb: "RWB", lwb: "LWB",
  cdm: "CDM", "وسط دفاعي": "CDM",
  cm: "CM", وسط: "CM",
  cam: "CAM", "صانع ألعاب": "CAM",
  lm: "LM", rm: "RM",
  lw: "LW", "جناح أيسر": "LW",
  rw: "RW", "جناح أيمن": "RW",
  st: "ST", مهاجم: "ST", "رأس حربة": "ST",
  cf: "CF",
};

// Positions considered natural substitutes when a slot cannot be filled.
const POSITION_FALLBACKS: Record<Position, Position[]> = {
  GK: [],
  RB: ["RWB", "RM", "CB"],
  LB: ["LWB", "LM", "CB"],
  CB: ["CDM"],
  RWB: ["RB", "RM"],
  LWB: ["LB", "LM"],
  CDM: ["CM", "CB"],
  CM: ["CDM", "CAM"],
  CAM: ["CM", "CF"],
  LM: ["LW", "LWB", "CM"],
  RM: ["RW", "RWB", "CM"],
  LW: ["LM", "ST", "CF"],
  RW: ["RM", "ST", "CF"],
  ST: ["CF", "LW", "RW"],
  CF: ["ST", "CAM"],
};

function normalizePosition(input: unknown): Position | null {
  if (input == null) return null;
  const k = String(input).trim();
  if (!k) return null;
  const up = k.toUpperCase();
  if ((POSITIONS as readonly string[]).includes(up)) return up as Position;
  return POSITION_ALIASES[k.toLowerCase()] ?? null;
}

// ---------- FUT.GG pool ----------
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
const POOL_PAGES = 10; // ~250 top cards — enough coverage per position for squads.

async function fetchPage(page: number): Promise<FGPlayer[]> {
  const r = await fetch(`${FUTGG_BASE}?sort=-overall&page=${page}`, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (futmac-squad/1.0)" },
  });
  if (!r.ok) { console.warn("[pool] page %d failed %d", page, r.status); return []; }
  const j = await r.json().catch(() => null);
  return Array.isArray(j?.data) ? (j.data as FGPlayer[]) : [];
}

async function getPool(): Promise<FGPlayer[]> {
  if (POOL_CACHE && Date.now() - POOL_CACHE.at < POOL_TTL_MS) return POOL_CACHE.players;
  const pages = await Promise.all(Array.from({ length: POOL_PAGES }, (_, i) => fetchPage(i + 1)));
  const seen = new Set<number>();
  const players: FGPlayer[] = [];
  for (const arr of pages) for (const p of arr) {
    const id = p.eaId; // use card eaId as unique id (variant-aware)
    if (!id || seen.has(id)) continue;
    seen.add(id); players.push(p);
  }
  POOL_CACHE = { at: Date.now(), players };
  console.log("[pool] loaded %d players", players.length);
  return players;
}

function playerPositions(p: FGPlayer): Position[] {
  const main = normalizePosition(p.position);
  const alts = Array.isArray(p.alternativePositions)
    ? p.alternativePositions.map(normalizePosition)
    : [];
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

// ---------- Formations ----------
const FORMATION_SLOTS: Record<string, { id: string; position: Position; x: number; y: number }[]> = {
  "4-3-3": [
    { id: "gk", position: "GK", x: 50, y: 6 },
    { id: "lb", position: "LB", x: 12, y: 24 },
    { id: "lcb", position: "CB", x: 34, y: 20 },
    { id: "rcb", position: "CB", x: 66, y: 20 },
    { id: "rb", position: "RB", x: 88, y: 24 },
    { id: "lcm", position: "CM", x: 26, y: 48 },
    { id: "cm", position: "CM", x: 50, y: 44 },
    { id: "rcm", position: "CM", x: 74, y: 48 },
    { id: "lw", position: "LW", x: 14, y: 78 },
    { id: "st", position: "ST", x: 50, y: 84 },
    { id: "rw", position: "RW", x: 86, y: 78 },
  ],
  "4-2-3-1": [
    { id: "gk", position: "GK", x: 50, y: 6 },
    { id: "lb", position: "LB", x: 12, y: 24 },
    { id: "lcb", position: "CB", x: 34, y: 20 },
    { id: "rcb", position: "CB", x: 66, y: 20 },
    { id: "rb", position: "RB", x: 88, y: 24 },
    { id: "lcdm", position: "CDM", x: 34, y: 40 },
    { id: "rcdm", position: "CDM", x: 66, y: 40 },
    { id: "lm", position: "LM", x: 16, y: 66 },
    { id: "cam", position: "CAM", x: 50, y: 64 },
    { id: "rm", position: "RM", x: 84, y: 66 },
    { id: "st", position: "ST", x: 50, y: 86 },
  ],
  "4-4-2": [
    { id: "gk", position: "GK", x: 50, y: 6 },
    { id: "lb", position: "LB", x: 12, y: 24 },
    { id: "lcb", position: "CB", x: 34, y: 20 },
    { id: "rcb", position: "CB", x: 66, y: 20 },
    { id: "rb", position: "RB", x: 88, y: 24 },
    { id: "lm", position: "LM", x: 14, y: 52 },
    { id: "lcm", position: "CM", x: 38, y: 50 },
    { id: "rcm", position: "CM", x: 62, y: 50 },
    { id: "rm", position: "RM", x: 86, y: 52 },
    { id: "lst", position: "ST", x: 36, y: 82 },
    { id: "rst", position: "ST", x: 64, y: 82 },
  ],
  "3-4-3": [
    { id: "gk", position: "GK", x: 50, y: 6 },
    { id: "lcb", position: "CB", x: 22, y: 22 },
    { id: "ccb", position: "CB", x: 50, y: 18 },
    { id: "rcb", position: "CB", x: 78, y: 22 },
    { id: "lm", position: "LM", x: 12, y: 50 },
    { id: "lcm", position: "CM", x: 38, y: 48 },
    { id: "rcm", position: "CM", x: 62, y: 48 },
    { id: "rm", position: "RM", x: 88, y: 50 },
    { id: "lw", position: "LW", x: 18, y: 80 },
    { id: "st", position: "ST", x: 50, y: 86 },
    { id: "rw", position: "RW", x: 82, y: 80 },
  ],
  "3-5-2": [
    { id: "gk", position: "GK", x: 50, y: 6 },
    { id: "lcb", position: "CB", x: 22, y: 22 },
    { id: "ccb", position: "CB", x: 50, y: 18 },
    { id: "rcb", position: "CB", x: 78, y: 22 },
    { id: "lm", position: "LM", x: 10, y: 54 },
    { id: "lcm", position: "CM", x: 32, y: 46 },
    { id: "cam", position: "CAM", x: 50, y: 62 },
    { id: "rcm", position: "CM", x: 68, y: 46 },
    { id: "rm", position: "RM", x: 90, y: 54 },
    { id: "lst", position: "ST", x: 36, y: 84 },
    { id: "rst", position: "ST", x: 64, y: 84 },
  ],
  "4-3-2-1": [
    { id: "gk", position: "GK", x: 50, y: 6 },
    { id: "lb", position: "LB", x: 12, y: 24 },
    { id: "lcb", position: "CB", x: 34, y: 20 },
    { id: "rcb", position: "CB", x: 66, y: 20 },
    { id: "rb", position: "RB", x: 88, y: 24 },
    { id: "lcm", position: "CM", x: 26, y: 46 },
    { id: "cm", position: "CM", x: 50, y: 42 },
    { id: "rcm", position: "CM", x: 74, y: 46 },
    { id: "lcam", position: "CAM", x: 32, y: 68 },
    { id: "rcam", position: "CAM", x: 68, y: 68 },
    { id: "st", position: "ST", x: 50, y: 88 },
  ],
};

function getFormation(id: string) {
  return FORMATION_SLOTS[id] ?? FORMATION_SLOTS["4-3-3"];
}

// ---------- Selection engine ----------
interface Filters {
  budget?: number;
  minRating?: number;
  nation?: string;
  league?: string;
  club?: string;
  preferSpecial?: boolean;
}

function matchesFilters(p: FGPlayer, f: Filters): boolean {
  if (f.minRating && p.overall < f.minRating) return false;
  if (f.nation && (p.nation?.name ?? "").toLowerCase() !== f.nation.toLowerCase()) return false;
  if (f.league && (p.league?.name ?? "").toLowerCase() !== f.league.toLowerCase()) return false;
  if (f.club && (p.club?.name ?? "").toLowerCase() !== f.club.toLowerCase()) return false;
  return true;
}

function candidatesForPosition(pool: FGPlayer[], pos: Position, filters: Filters, excludeIds: Set<number>): FGPlayer[] {
  const primaryOrder: Position[] = [pos, ...(POSITION_FALLBACKS[pos] ?? [])];
  const buckets: FGPlayer[] = [];
  for (const targetPos of primaryOrder) {
    for (const p of pool) {
      if (excludeIds.has(p.eaId)) continue;
      const positions = playerPositions(p);
      if (!positions.includes(targetPos)) continue;
      if (!matchesFilters(p, filters)) continue;
      buckets.push(p);
    }
    if (buckets.length >= 20) break;
  }
  // De-dup while preserving order
  const seen = new Set<number>();
  return buckets.filter((p) => { if (seen.has(p.eaId)) return false; seen.add(p.eaId); return true; });
}

interface BuiltSlot {
  id: string; position: Position; x: number; y: number;
  player: ReturnType<typeof shape> | null;
  reason?: string;
}

function scorePlayer(p: FGPlayer, targetPos: Position, filters: Filters, chemHint: {
  clubs: Map<string, number>; leagues: Map<string, number>; nations: Map<string, number>;
}): number {
  const natural = normalizePosition(p.position) === targetPos ? 8 : 0;
  const chem =
    (chemHint.clubs.get((p.club?.name ?? "").toLowerCase()) ?? 0) * 3 +
    (chemHint.leagues.get((p.league?.name ?? "").toLowerCase()) ?? 0) * 1 +
    (chemHint.nations.get((p.nation?.name ?? "").toLowerCase()) ?? 0) * 1.5;
  const special = filters.preferSpecial && (p.isSpecial || p.isIcon || p.isHero) ? 4 : 0;
  const budgetPenalty = filters.budget && typeof p.price === "number" && p.price > filters.budget / 6
    ? -6 : 0;
  return p.overall + natural + chem + special + budgetPenalty;
}

async function buildSquadDeterministic(formationId: string, filters: Filters): Promise<{ slots: BuiltSlot[]; reasoning: string[] }> {
  const slots = getFormation(formationId);
  const pool = await getPool();
  const chemHint = { clubs: new Map<string, number>(), leagues: new Map<string, number>(), nations: new Map<string, number>() };
  const used = new Set<number>();
  const built: BuiltSlot[] = [];
  const reasoning: string[] = [];

  // Fill defenders first, then mid, then attackers, then GK — helps chem cluster.
  const order = [...slots.entries()].sort((a, b) => a[1].y - b[1].y);

  for (const [, slot] of order) {
    const cands = candidatesForPosition(pool, slot.position, filters, used);
    if (cands.length === 0) {
      built.push({ ...slot, player: null, reason: `لا يوجد لاعب متوفر لهذا المركز ضمن الفلاتر.` });
      continue;
    }
    let best: FGPlayer | null = null; let bestScore = -Infinity;
    for (const c of cands.slice(0, 30)) {
      const s = scorePlayer(c, slot.position, filters, chemHint);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (!best) { built.push({ ...slot, player: null, reason: "لم يُعثر على مرشح مناسب." }); continue; }
    used.add(best.eaId);
    const club = (best.club?.name ?? "").toLowerCase();
    const league = (best.league?.name ?? "").toLowerCase();
    const nation = (best.nation?.name ?? "").toLowerCase();
    if (club) chemHint.clubs.set(club, (chemHint.clubs.get(club) ?? 0) + 1);
    if (league) chemHint.leagues.set(league, (chemHint.leagues.get(league) ?? 0) + 1);
    if (nation) chemHint.nations.set(nation, (chemHint.nations.get(nation) ?? 0) + 1);
    built.push({
      ...slot, player: shape(best),
      reason: `${best.overall} تقييم • ${normalizePosition(best.position) === slot.position ? "مركز طبيعي" : "بديل مناسب"}`,
    });
  }

  // Order built back to original slot order
  built.sort((a, b) => slots.findIndex((s) => s.id === a.id) - slots.findIndex((s) => s.id === b.id));

  const filledCount = built.filter((b) => b.player).length;
  reasoning.push(`تم اختيار ${filledCount}/${slots.length} لاعباً من أفضل الكروت المتاحة في القاعدة.`);
  if (filters.minRating) reasoning.push(`الحد الأدنى للتقييم: ${filters.minRating}.`);
  if (filters.budget) reasoning.push(`الميزانية المستهدفة: ${filters.budget.toLocaleString()} كوين.`);
  if (filters.nation) reasoning.push(`تفضيل جنسية: ${filters.nation}.`);
  if (filters.league) reasoning.push(`تفضيل دوري: ${filters.league}.`);
  return { slots: built, reasoning };
}

// ---------- Squad ops ----------
type IncomingSquad = {
  formation: string;
  slots: { id: string; position: string; player: ReturnType<typeof shape> | null }[];
};

async function cheaperVersion(current: IncomingSquad, targetBudget?: number): Promise<{ slots: BuiltSlot[]; reasoning: string[] }> {
  const pool = await getPool();
  const used = new Set<number>(current.slots.map((s) => s.player?.id).filter(Boolean) as number[]);
  const built: BuiltSlot[] = [];
  const reasoning: string[] = [];
  const slotDefs = getFormation(current.formation);
  // Sort by highest current price first; those get swapped first.
  const withPrice = slotDefs.map((s, idx) => {
    const cur = current.slots.find((c) => c.id === s.id)?.player ?? null;
    return { slot: s, cur, idx, price: cur?.price ?? 0 };
  }).sort((a, b) => b.price - a.price);

  let remainingBudget = targetBudget;
  for (const { slot, cur } of withPrice) {
    if (!cur) { built.push({ ...slot, player: null }); continue; }
    const cap = remainingBudget != null ? Math.max(500, Math.floor(remainingBudget / withPrice.length)) : (cur.price ? Math.floor(cur.price * 0.6) : undefined);
    used.delete(cur.id);
    const cands = candidatesForPosition(pool, slot.position, {}, used).slice(0, 40);
    let pick: FGPlayer | null = null;
    for (const c of cands) {
      const price = typeof c.price === "number" ? c.price : 0;
      if (cap != null && price > cap) continue;
      if (!pick || c.overall > pick.overall) pick = c;
    }
    if (!pick) pick = cands[0] ?? null;
    if (!pick) { used.add(cur.id); built.push({ ...slot, player: cur }); continue; }
    used.add(pick.eaId);
    const shaped = shape(pick);
    if (remainingBudget != null && typeof shaped.price === "number") remainingBudget -= shaped.price;
    built.push({ ...slot, player: shaped, reason: cur.id !== shaped.id ? `تخفيض السعر مع الحفاظ على التقييم` : undefined });
  }
  built.sort((a, b) => slotDefs.findIndex((s) => s.id === a.id) - slotDefs.findIndex((s) => s.id === b.id));
  reasoning.push("تم استبدال أغلى اللاعبين ببدائل أقل سعراً مع الحفاظ على أعلى تقييم ممكن.");
  if (targetBudget) reasoning.push(`الميزانية المستهدفة: ${targetBudget.toLocaleString()} كوين.`);
  return { slots: built, reasoning };
}

async function improveChemistry(current: IncomingSquad): Promise<{ slots: BuiltSlot[]; reasoning: string[] }> {
  // Find the dominant club/league/nation among the current squad and rebuild
  // with a strong preference for that cluster.
  const tally = { club: new Map<string, number>(), league: new Map<string, number>(), nation: new Map<string, number>() };
  for (const s of current.slots) {
    const p = s.player; if (!p) continue;
    if (p.club) tally.club.set(p.club, (tally.club.get(p.club) ?? 0) + 1);
    if (p.league) tally.league.set(p.league, (tally.league.get(p.league) ?? 0) + 1);
    if (p.nation) tally.nation.set(p.nation, (tally.nation.get(p.nation) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const league = top(tally.league);
  const nation = top(tally.nation);
  const { slots, reasoning } = await buildSquadDeterministic(current.formation, { league, nation });
  reasoning.unshift(`تم تحسين الكيمياء بتركيز اللاعبين على دوري "${league ?? "-"}" وجنسية "${nation ?? "-"}".`);
  return { slots, reasoning };
}

// ---------- OpenAI intent parser ----------
const SYSTEM_PARSE = `أنت محلل نوايا لبناء تشكيلة FC 26. حوّل طلب المستخدم إلى JSON صالح فقط بلا نص إضافي.
الحقول:
{
  "action": "build" | "cheaper" | "improve_chem" | "change_formation",
  "formation": "4-3-3" | "4-2-3-1" | "4-4-2" | "3-4-3" | "3-5-2" | "4-3-2-1" | null,
  "filters": { "budget": number|null, "minRating": number|null, "nation": string|null, "league": string|null, "club": string|null, "preferSpecial": boolean|null } | null,
  "reply": string   // جملة عربية قصيرة تصف ما ستفعله
}
لا تخترع لاعبين. إن لم تفهم اختر action="build".`;

async function parseIntent(apiKey: string, prompt: string, current?: IncomingSquad) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PARSE },
        { role: "user", content: `الطلب: ${prompt}\nالتشكيلة الحالية: ${current?.formation ?? "لا يوجد"}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`intent parse failed ${res.status}`);
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(text); } catch { return { action: "build" }; }
}

// ---------- HTTP ----------
const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    if (!body?.action) return jsonRes({ error: "action مطلوب" }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (body.action === "build") {
      let filters: Filters = body.filters ?? {};
      let formation: string = body.formation ?? "4-3-3";
      let reply: string | undefined;
      if (body.prompt && apiKey) {
        try {
          const parsed = await parseIntent(apiKey, body.prompt, body.current);
          if (parsed.formation) formation = parsed.formation;
          if (parsed.filters) filters = { ...filters, ...Object.fromEntries(Object.entries(parsed.filters).filter(([, v]) => v != null)) };
          reply = parsed.reply;
        } catch (e) { console.warn("intent parse skipped:", (e as Error).message); }
      }
      const { slots, reasoning } = await buildSquadDeterministic(formation, filters);
      return jsonRes({ squad: { formation, slots }, reasoning: reply ? [reply, ...reasoning] : reasoning, intent: { formation, filters } });
    }

    if (body.action === "cheaper") {
      if (!body.current) return jsonRes({ error: "current مطلوب" }, 400);
      const { slots, reasoning } = await cheaperVersion(body.current, body.targetBudget);
      return jsonRes({ squad: { formation: body.current.formation, slots }, reasoning });
    }

    if (body.action === "improve_chem") {
      if (!body.current) return jsonRes({ error: "current مطلوب" }, 400);
      const { slots, reasoning } = await improveChemistry(body.current);
      return jsonRes({ squad: { formation: body.current.formation, slots }, reasoning });
    }

    if (body.action === "change_formation") {
      if (!body.formation) return jsonRes({ error: "formation مطلوب" }, 400);
      // Rebuild fresh using best-rated pool; keep previous filters loose.
      const { slots, reasoning } = await buildSquadDeterministic(body.formation, {});
      return jsonRes({ squad: { formation: body.formation, slots }, reasoning });
    }

    if (body.action === "candidates") {
      const pos = normalizePosition(body.position);
      if (!pos) return jsonRes({ error: "position غير صالح" }, 400);
      const pool = await getPool();
      const excl = new Set<number>(Array.isArray(body.excludeIds) ? body.excludeIds : []);
      const cands = candidatesForPosition(pool, pos, body.filters ?? {}, excl).slice(0, 24).map(shape);
      return jsonRes({ position: pos, candidates: cands, ...(cands.length === 0 ? { note: "لا يوجد مرشحون ضمن هذه الفلاتر." } : {}) });
    }

    if (body.action === "parse") {
      if (!apiKey) return jsonRes({ error: "OPENAI_API_KEY غير مضبوط" }, 500);
      const command = await parseIntent(apiKey, body.prompt, body.current);
      return jsonRes({ command });
    }

    return jsonRes({ error: `action غير مدعوم: ${body.action}` }, 400);
  } catch (e) {
    console.error("squad-builder error:", e);
    return jsonRes({ error: (e as Error).message || "خطأ غير متوقع" }, 500);
  }
});
