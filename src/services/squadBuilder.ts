import { supabase } from "@/integrations/supabase/client";
import type { BuildFilters, Squad, SquadPlayer } from "@/types/squad";

interface BuildResponse {
  squad: Squad;
  reasoning?: string[];
  intent?: { formation?: string; filters?: BuildFilters };
}

interface CandidatesResponse {
  position: string;
  candidates: SquadPlayer[];
  note?: string;
}

type Action =
  | { action: "build"; formation: string; filters?: BuildFilters; prompt?: string; current?: Squad }
  | { action: "cheaper"; current: Squad; targetBudget?: number }
  | { action: "improve_chem"; current: Squad }
  | { action: "change_formation"; current: Squad; formation: string }
  | { action: "candidates"; position: string; slotId: string; excludeIds?: number[]; filters?: BuildFilters }
  | { action: "parse"; prompt: string; current?: Squad };

async function call<T>(payload: Action): Promise<T> {
  const { data, error } = await supabase.functions.invoke("squad-builder", { body: payload });
  if (error) throw new Error((error as any)?.message || "تعذّر الاتصال بمولد التشكيلات.");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const squadBuilderApi = {
  build: (formation: string, filters?: BuildFilters, prompt?: string, current?: Squad) =>
    call<BuildResponse>({ action: "build", formation, filters, prompt, current }),
  cheaper: (current: Squad, targetBudget?: number) =>
    call<BuildResponse>({ action: "cheaper", current, targetBudget }),
  improveChem: (current: Squad) =>
    call<BuildResponse>({ action: "improve_chem", current }),
  changeFormation: (current: Squad, formation: string) =>
    call<BuildResponse>({ action: "change_formation", current, formation }),
  candidates: (position: string, slotId: string, excludeIds: number[] = [], filters?: BuildFilters) =>
    call<CandidatesResponse>({ action: "candidates", position, slotId, excludeIds, filters }),
  parse: (prompt: string, current?: Squad) =>
    call<{ command: any; reply?: string }>({ action: "parse", prompt, current }),
};
