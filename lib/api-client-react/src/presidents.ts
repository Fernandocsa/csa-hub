import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface PresidentTermSummary {
  id: number;
  termStart: string | null;
  termEnd: string | null;
  isCurrent: boolean;
  passageIndex: number;
}

export interface PresidentItem {
  id: number;
  name: string;
  photoUrl: string | null;
  termStart: string | null;
  termEnd: string | null;
  isCurrent?: boolean;
  personKey?: number | null;
  passageIndex?: number | null;
  passageCount?: number | null;
  otherTerms?: PresidentTermSummary[];
  notes: string | null;
  linkedPlayerId?: number | null;
  linkedPlayerName?: string | null;
  linkedManagerId?: number | null;
  linkedManagerName?: string | null;
}

export const getPresidents = async (): Promise<PresidentItem[]> =>
  customFetch<PresidentItem[]>("/api/presidents");

export const getPresidentsQueryKey = () => ["/api/presidents"] as const;

export const useGetPresidents = () =>
  useQuery({
    queryKey: getPresidentsQueryKey(),
    queryFn: getPresidents,
  });
