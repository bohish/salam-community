// Deterministic search ranking for players.
// Priority (higher score wins):
//  1. Exact match (full name)
//  2. Exact match on last word (e.g. "Salah" -> "Mohamed Salah")
//  3. Starts-with on any word
//  4. Whole word match anywhere
//  5. Prefix on full string
//  6. Contains
//  7. Fuzzy (subsequence)
// Ties broken by higher OVR.

import type { Player } from "@/types/player";

const norm = (s: string): string =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const words = (s: string): string[] => norm(s).split(/[\s\-']+/).filter(Boolean);

const isSubsequence = (needle: string, hay: string): boolean => {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) {
    if (hay[j] === needle[i]) i++;
  }
  return i === needle.length;
};

export function scorePlayer(p: Player, rawQuery: string): number {
  const q = norm(rawQuery);
  if (!q) return 0;

  // Direct ID match wins everything
  if (String(p.id) === q) return 100000;
  if (String(p.id).includes(q) && /^\d+$/.test(q)) return 90000;

  const name = norm(p.name);
  const nameWords = words(p.name);
  const qWords = q.split(/\s+/).filter(Boolean);

  let score = 0;

  if (name === q) score = Math.max(score, 10000);

  // Exact match on any word (e.g. "salah")
  if (nameWords.includes(q)) {
    // Prefer when it's the LAST word (surname) — feels most natural
    const isLast = nameWords[nameWords.length - 1] === q;
    score = Math.max(score, isLast ? 9000 : 8500);
  }

  // All query words appear as exact words in name (order-independent)
  if (qWords.length > 1 && qWords.every((w) => nameWords.includes(w))) {
    score = Math.max(score, 8000);
  }

  // Starts-with any word
  if (nameWords.some((w) => w.startsWith(q))) {
    score = Math.max(score, 7000);
  }

  // Full name starts with query
  if (name.startsWith(q)) score = Math.max(score, 6500);

  // Contains as substring
  if (name.includes(q)) score = Math.max(score, 5000);

  // Club / nation / league contains — weaker signal
  const meta = `${norm(p.club)} ${norm(p.nation)} ${norm(p.league)}`;
  if (meta.includes(q)) score = Math.max(score, 2000);

  // Fuzzy subsequence — last resort
  if (score === 0 && q.length >= 3 && isSubsequence(q, name)) {
    score = 500;
  }

  if (score === 0) return 0;

  // OVR tiebreaker (up to +99)
  return score + Math.min(99, p.rating);
}

export function rankPlayers(players: Player[], query: string, limit?: number): Player[] {
  const q = query?.trim();
  if (!q) {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    return limit ? sorted.slice(0, limit) : sorted;
  }
  const scored = players
    .map((p) => ({ p, s: scorePlayer(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const out = scored.map((x) => x.p);
  return limit ? out.slice(0, limit) : out;
}

/** Split text into segments marking matches for highlighting. */
export function highlightSegments(text: string, query: string): { text: string; match: boolean }[] {
  const q = (query || "").trim();
  if (!q) return [{ text, match: false }];
  const nText = norm(text);
  const nQuery = norm(q);
  const idx = nText.indexOf(nQuery);
  if (idx === -1) return [{ text, match: false }];
  return [
    { text: text.slice(0, idx), match: false },
    { text: text.slice(idx, idx + nQuery.length), match: true },
    { text: text.slice(idx + nQuery.length), match: false },
  ].filter((s) => s.text.length > 0);
}
