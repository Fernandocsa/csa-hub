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

export type OnThisDayParams = {
  month?: number;
  day?: number;
};

export const getOnThisDay = (params?: OnThisDayParams) => {
  const qs = new URLSearchParams();
  if (params?.month != null) qs.set("month", String(params.month));
  if (params?.day != null) qs.set("day", String(params.day));
  const q = qs.toString();
  return customFetch<OnThisDayPayload>(`/api/matches/on-this-day${q ? `?${q}` : ""}`);
};

export const getOnThisDayQueryKey = (params?: OnThisDayParams) =>
  ["/api/matches/on-this-day", params?.month ?? null, params?.day ?? null] as const;

export const useGetOnThisDay = (params?: OnThisDayParams) =>
  useQuery({
    queryKey: getOnThisDayQueryKey(params),
    queryFn: () => getOnThisDay(params),
    staleTime: 60_000,
  });
