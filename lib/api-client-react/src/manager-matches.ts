import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface ManagerMatch {
  matchId: number;
  date: string;
  season: string;
  opponentId?: number;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
}

export interface ManagerMatchesResponse {
  managerId: number;
  managerName: string;
  total: number;
  matches: ManagerMatch[];
}

export const getManagerMatches = (id: number) =>
  customFetch<ManagerMatchesResponse>(`/api/managers/${id}/matches`);

export const getManagerMatchesQueryKey = (id: number) =>
  [`/api/managers/${id}/matches`] as const;

export const useGetManagerMatches = (id: number) =>
  useQuery({
    queryKey: getManagerMatchesQueryKey(id),
    queryFn: () => getManagerMatches(id),
    enabled: Number.isFinite(id) && id > 0,
  });
