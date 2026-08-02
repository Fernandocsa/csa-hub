import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type OnThisDayMatch = {
  id: number;
  date: string;
  opponentId?: number;
  opponent: string;
  opponentLogoUrl?: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competition: string;
  season: string;
  stadium: string | null;
  yearsAgo: number | null;
};

export type OnThisDayPayload = {
  date: string;
  month: number;
  day: number;
  total: number;
  matches: OnThisDayMatch[];
};

export const getOnThisDay = () =>
  customFetch<OnThisDayPayload>("/api/matches/on-this-day");

export const getOnThisDayQueryKey = () =>
  ["/api/matches/on-this-day"] as const;

export const useGetOnThisDay = () =>
  useQuery({
    queryKey: getOnThisDayQueryKey(),
    queryFn: getOnThisDay,
    staleTime: 60_000,
  });
