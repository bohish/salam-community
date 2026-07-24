// Futmac AI Coach — service layer.
// Sends chat messages to the `ai-coach` Supabase Edge Function,
// which calls OpenAI server-side using OPENAI_API_KEY.

import { supabase } from "@/integrations/supabase/client";

export type CoachRole = "user" | "assistant";

export interface CoachMessage {
  id: string;
  role: CoachRole;
  content: string;
  createdAt: number;
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
  { id: "analyze", label: "حلّل تشكيلتي", prompt: "حلّل نقاط القوة والضعف في تشكيلتي الحالية.", emoji: "🔍" },
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

export function createMessage(role: CoachRole, content: string): CoachMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
  };
}
