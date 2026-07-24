## Analyze My Squad — feature plan

Add an end-to-end flow where the user uploads an FC/FUTBIN/Futmac squad screenshot and Futmac reconstructs the squad inside the existing Squad Builder, then runs an AI analysis with actionable one-click fixes.

### 1. UX flow (on `/squad` page)

- New header button "🖼️ حلّل تشكيلتي" opens an upload sheet.
- Sheet: drop-zone/file input (accept PNG/JPG, max ~5 MB), budget input (coins, optional), formation hint (optional dropdown, defaults to auto-detect), "تحليل" button.
- On submit: show progress states (Uploading → Detecting players → Matching database → Building squad → Analyzing).
- Detected players list appears with each slot showing:
  - The AI-suggested player (name, rating, position, club, avatar).
  - Confidence badge. If `confidence < 0.75` OR multiple candidates → user must pick from a small candidate list (or "skip slot"/"search manually") before the squad loads.
- After confirmation: squad populates the pitch via existing `SquadPage` state; live HUD (chem/rating/price) updates automatically.
- New "AI Analysis" panel appears under the pitch with sections:
  - Strengths / Weaknesses / Chemistry notes / Tactical advice.
  - Suggested upgrades (respect budget) — each row shows current → suggested with delta rating/price.
  - Cheaper alternatives per slot.
  - One-click action buttons (each just dispatches a new AI request with a fixed intent):
    - "تحسين الكيمياء" (Improve Chemistry)
    - "ترقية الهجوم" (Upgrade Attack)
    - "استبدال الأضعف" (Replace Weakest)
    - "ضمن الميزانية" (Optimize for Budget)

### 2. Backend — new edge function `analyze-squad`

Single function handling two modes via `action` field:

- `detect`: input `{ image: base64, formationHint?: string }`.
  1. Call vision model `google/gemini-3.1-flash` (chat completions, image_url with data URL) with a strict JSON-only prompt: return `{ formation, players: [{ position, name, rating?, club?, nation?, cardName?, confidence }] }`.
  2. For each detected player, call the existing hybrid resolver (reuse `fuzzy` search against FUT.GG pool + MSMC exact) to produce a **candidates list** (top 3) with `matchConfidence` per candidate.
  3. Return `{ formation, slots: [{ position, detected, candidates: [...] }] }` — no auto-selection when top candidate `< 0.75`.

- `analyze`: input `{ squad: [{ position, playerId, rating, price, club, nation, league }], budget?: number, intent?: 'general'|'chem'|'attack'|'weakest'|'budget' }`.
  1. Recompute chemistry/rating/price server-side (reuse chemistry logic).
  2. For each slot, fetch top candidates from the FUT.GG pool matching position + budget filter.
  3. Send everything to `openai/gpt-5-mini` (or `gpt-5.4-mini`) as structured grounded prompt. System prompt forbids inventing players; must return JSON:
     ```json
     {
       "summary": "...",
       "strengths": ["..."],
       "weaknesses": ["..."],
       "chemistry": { "current": 27, "target": 33, "notes": ["..."] },
       "tactics": ["..."],
       "upgrades": [{ "slot": 4, "reason": "...", "suggestedId": 231747, "deltaRating": +3, "deltaPrice": 45000 }],
       "cheaperAlternatives": [{ "slot": 7, "suggestedId": ..., "savings": 20000 }],
       "actions": { "improveChem": [swap list], "upgradeAttack": [...], "replaceWeakest": {...}, "optimizeBudget": [...] }
     }
     ```
  4. Return the JSON directly to the client.

Both modes stream nothing (JSON response), reuse existing FUT.GG pool + normalization utilities. Uses `OPENAI_API_KEY` (already set). Vision call also uses OpenAI (`gpt-4o-mini`) as fallback if Gemini is not available — but plan is **OpenAI `gpt-4o` vision** since it's already wired in the coach.

### 3. Frontend files

New:
- `src/services/squadAnalyzer.ts` — `detectFromImage(file, budget?)`, `analyzeSquad(squad, intent, budget?)`, base64 conversion, error handling.
- `src/components/squad/AnalyzeSheet.tsx` — upload + budget input + progress states + candidate confirmation UI.
- `src/components/squad/AnalysisPanel.tsx` — renders analysis JSON with sections + one-click buttons.

Modified:
- `src/pages/SquadPage.tsx` — add "Analyze" button in header, wire sheet, apply detected squad to state, render analysis panel, wire one-click actions (each calls `analyzeSquad(..., intent)` then applies returned `actions[intent]` swaps to the pitch).

### 4. Confidence & confirmation rule

- Top candidate ≥ 0.85 AND clearly better than #2 (gap ≥ 0.15) → auto-fill slot, but still show "change" affordance.
- Otherwise → slot marked "requires confirmation", user picks from candidates or opens search modal.
- If no candidate at all → slot left empty with a note "لم يُتعرّف على اللاعب — أضفه يدوياً".

### 5. Technical details

- Image sent as base64 data URL, capped at 1600px on the longest side (client-side resize with canvas) to keep payload under 4 MB and vision latency low.
- Vision system prompt: strictly JSON, Arabic + English names allowed, output list ordered by pitch position (top→bottom rows).
- All player data (name/rating/price/club) written to state comes from the DB match, never from the vision output — vision is used only to identify who the card represents.
- Errors surfaced with sonner toasts; 429/402 handled with clear Arabic messages consistent with the existing coach.
- No new tables. Squad state stays in memory / existing store.

### 6. Out of scope (not in this change)

- Saving analyzed squads to the DB / user profile.
- OCR for card prices/chemistry numbers directly from the image (we recompute from DB).
- Video or multi-image uploads.
