// Placeholder service — player Evolutions.
export interface Evolution {
  id: string;
  title: string;
  requirements: string[];
  stages: number;
}
export const fetchEvolutions = async (): Promise<Evolution[]> => [];
