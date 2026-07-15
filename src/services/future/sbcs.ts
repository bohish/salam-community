// Placeholder service — Squad Building Challenges.
export interface SBC {
  id: string;
  title: string;
  reward: string;
  expiresAt: string | null;
  segments: number;
}
export const fetchSBCs = async (): Promise<SBC[]> => [];
