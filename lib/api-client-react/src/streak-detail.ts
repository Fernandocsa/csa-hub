import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type StreakDetailType = "winning" | "unbeaten" | "losing";

export interface StreakDetailMatch {
  id: number;
  date: string;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competition: string;
}

export interface StreakDetail {
  type: StreakDetailType;
  length: number;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent?: boolean;
  matches: StreakDetailMatch[];
}

export const getStreakDetail = async (type: StreakDetailType): Promise<StreakDetail> =>
  customFetch<StreakDetail>(`/api/records/streaks/${type}`);

export const getStreakDetailQueryKey = (type: StreakDetailType) =>
  ["/api/records/streaks", type] as const;

export const useGetStreakDetail = (type: StreakDetailType) =>
  useQuery({
    queryKey: getStreakDetailQueryKey(type),
    queryFn: () => getStreakDetail(type),
  });
