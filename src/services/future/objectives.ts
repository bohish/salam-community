// Placeholder service — Objectives.
export interface Objective {
  id: string;
  title: string;
  reward: string;
  progress: number;
  total: number;
}
export const fetchObjectives = async (): Promise<Objective[]> => [];
