import { supabase } from "@/integrations/supabase/client";
import type { Squad, SquadPlayer } from "@/types/squad";

export interface DetectedSlot {
  slotIndex: number;
  position: string | null;
  detected: { name: string; rating: number | null; club: string | null; nation: string | null; confidence: number | null };
  candidates: { player: SquadPlayer; matchConfidence: number }[];
  autoSelected: SquadPlayer | null;
  needsConfirmation: boolean;
}
export interface DetectResponse {
  formation: string | null;
  slots: DetectedSlot[];
  poolSize: number;
}

export type AnalysisIntent = "general" | "chem" | "attack" | "weakest" | "budget";

export interface SwapSuggestion {
  slotId: string;
  suggestedId?: number;
  reason?: string;
  deltaRating?: number;
  deltaPrice?: number | null;
  savings?: number | null;
  player: SquadPlayer;
}
export interface AnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  chemistry: { current: number; target: number; notes: string[] };
  tactics: string[];
  upgrades: SwapSuggestion[];
  cheaperAlternatives: SwapSuggestion[];
  actions: {
    improveChem: SwapSuggestion[];
    upgradeAttack: SwapSuggestion[];
    replaceWeakest: SwapSuggestion | null;
    optimizeBudget: SwapSuggestion[];
  };
  stats: { rating: number; price: number; chem: number; filled: number };
}

// Resize the image on the client so vision payloads stay ~<4MB and latency low.
export async function fileToResizedDataUrl(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas غير مدعوم في هذا المتصفح.");
  ctx.drawImage(bmp, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

async function invoke<T>(body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("analyze-squad", { body });
  if (error) throw new Error((error as any)?.message || "تعذّر الاتصال بمحلل التشكيلات.");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const squadAnalyzerApi = {
  detect: (image: string, formationHint?: string) =>
    invoke<DetectResponse>({ action: "detect", image, formationHint }),
  analyze: (squad: Squad, intent: AnalysisIntent = "general", budget?: number) =>
    invoke<AnalysisResponse>({ action: "analyze", squad, intent, budget }),
};
