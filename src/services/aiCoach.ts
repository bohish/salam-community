// Futmac AI Coach — service layer.
// Sends chat messages to the `ai-coach` Supabase Edge Function,
// which calls OpenAI server-side using OPENAI_API_KEY.
// Also exposes analyzeSquadImage() to run the image → detect → analyze pipeline
// directly from inside the chat.

import { supabase } from "@/integrations/supabase/client";
import {
  fileToResizedDataUrl,
  squadAnalyzerApi,
  type AnalysisResponse,
  type SwapSuggestion,
} from "@/services/squadAnalyzer";
import type { Squad, SquadPlayer, SquadSlotState } from "@/types/squad";

export type CoachRole = "user" | "assistant";

export interface CoachAttachmentPreview {
  kind: "image";
  url: string; // object URL for preview only
  name: string;
}

export interface CoachMessage {
  id: string;
  role: CoachRole;
  content: string;
  createdAt: number;
  attachment?: CoachAttachmentPreview;
}

export interface CoachContext {
  favoriteIds?: number[];
  budget?: number;
  formation?: string;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
  emoji: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "build", label: "ابنِ تشكيلتي", prompt: "ساعدني في بناء تشكيلة قوية 4-3-3 بميزانية متوسطة.", emoji: "🏗️" },
  { id: "analyze", label: "حلّل تشكيلتي", prompt: "ارفع لقطة شاشة لتشكيلتك من زر 📎 وسأحلّلها تلقائياً.", emoji: "🖼️" },
  { id: "compare", label: "قارن لاعبين", prompt: "قارن بين مبابي وهالاند وأيهم أفضل للهجوم.", emoji: "⚖️" },
  { id: "upgrade", label: "اقترح ترقيات", prompt: "ما أفضل الترقيات لتشكيلتي في هذا الأسبوع؟", emoji: "⬆️" },
];

export async function sendCoachMessage(
  history: CoachMessage[],
  userPrompt: string,
  _context?: CoachContext,
  _signal?: AbortSignal,
): Promise<string> {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userPrompt },
  ];

  const { data, error } = await supabase.functions.invoke("ai-coach", {
    body: { messages },
  });

  if (error) {
    const msg = (error as any)?.message || "تعذّر الاتصال بمدرب futmac.";
    throw new Error(msg);
  }
  if (!data?.reply) {
    throw new Error((data as any)?.error || "رد فارغ من المدرب.");
  }
  return data.reply as string;
}

export function createMessage(
  role: CoachRole,
  content: string,
  attachment?: CoachAttachmentPreview,
): CoachMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
    attachment,
  };
}

// ---------- Image → squad analysis pipeline ----------

export type AnalyzeStage = "resizing" | "detecting" | "building" | "analyzing";

export interface AnalyzeImageResult {
  reply: string;
  analysis: AnalysisResponse;
  squad: Squad;
  detectedCount: number;
  unresolvedCount: number;
}

export async function analyzeSquadImage(
  file: File,
  onStage?: (s: AnalyzeStage) => void,
): Promise<AnalyzeImageResult> {
  if (!/^image\//.test(file.type)) throw new Error("الملف ليس صورة.");
  if (file.size > 10 * 1024 * 1024) throw new Error("حجم الصورة كبير جداً (الحد 10MB).");

  onStage?.("resizing");
  const dataUrl = await fileToResizedDataUrl(file).catch(() => {
    throw new Error("تعذّر معالجة الصورة على جهازك.");
  });

  onStage?.("detecting");
  const detection = await squadAnalyzerApi.detect(dataUrl);
  if (!detection.slots?.length) {
    throw new Error("لم أتعرّف على أي لاعب في الصورة. جرّب صورة أوضح لكامل التشكيلة.");
  }

  onStage?.("building");
  const formation = detection.formation || "4-3-3";
  const slots: SquadSlotState[] = detection.slots.map((s, i) => {
    const pick: SquadPlayer | null =
      s.autoSelected ?? s.candidates[0]?.player ?? null;
    return {
      id: `slot-${i}`,
      position: (s.position ?? pick?.position ?? "SUB") as string,
      x: 0,
      y: 0,
      player: pick,
    };
  });
  const squad: Squad = { formation, slots };
  const unresolved = slots.filter((s) => !s.player).length;

  onStage?.("analyzing");
  const analysis = await squadAnalyzerApi.analyze(squad, "general");

  const reply = renderAnalysisMarkdown(analysis, squad, unresolved);
  return { reply, analysis, squad, detectedCount: slots.length, unresolvedCount: unresolved };
}

function formatPrice(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "غير متوفر";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function renderAnalysisMarkdown(a: AnalysisResponse, squad: Squad, unresolved: number): string {
  const lines: string[] = [];
  lines.push(`**📋 تحليل التشكيلة (${squad.formation})**`);
  lines.push(
    `التقييم: **${a.stats.rating}** • الكيمياء: **${a.stats.chem}/33** • السعر: **${formatPrice(a.stats.price)}** • اللاعبون: **${a.stats.filled}/${squad.slots.length}**`,
  );
  if (unresolved > 0) {
    lines.push(`⚠️ لم أتمكن من التعرّف على ${unresolved} لاعب — قد يؤثر ذلك على دقة التحليل.`);
  }
  if (a.summary) lines.push("", a.summary);

  const section = (title: string, items: string[]) => {
    if (!items?.length) return;
    lines.push("", `**${title}**`);
    for (const it of items) lines.push(`• ${it}`);
  };
  section("✅ نقاط القوة", a.strengths ?? []);
  section("⚠️ نقاط الضعف", a.weaknesses ?? []);
  section("🧪 ملاحظات الكيمياء", a.chemistry?.notes ?? []);
  section("🎯 نصائح تكتيكية", a.tactics ?? []);

  const swapLine = (s: SwapSuggestion) => {
    const p = s.player;
    const delta = typeof s.deltaRating === "number" ? ` (${s.deltaRating > 0 ? "+" : ""}${s.deltaRating} تقييم)` : "";
    const price = p.price != null ? ` — ${formatPrice(p.price)}` : "";
    const reason = s.reason ? ` — ${s.reason}` : "";
    return `${p.position} → **${p.name}** (${p.rating})${delta}${price}${reason}`;
  };

  if (a.upgrades?.length) {
    lines.push("", "**⬆️ ترقيات مقترحة**");
    for (const u of a.upgrades.slice(0, 5)) lines.push(`• ${swapLine(u)}`);
  }
  if (a.cheaperAlternatives?.length) {
    lines.push("", "**💰 بدائل أرخص**");
    for (const u of a.cheaperAlternatives.slice(0, 5)) lines.push(`• ${swapLine(u)}`);
  }

  lines.push(
    "",
    "لفتح التشكيلة كاملة مع تعديلات بنقرة واحدة (تحسين الكيمياء، ترقية الهجوم…) توجّه إلى صفحة **التشكيلة** واستخدم زر 🖼️ حلّل تشكيلتي.",
  );
  return lines.join("\n");
}
