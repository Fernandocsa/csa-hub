import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface FriendlyMatch {
  id: number;
  date: string;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competition: string;
  season: string;
  stadium: string | null;
  isFriendly: boolean;
}

export interface ListFriendliesParams {
  season?: string;
  opponent?: string;
  limit?: number;
  offset?: number;
}

export const getFriendlies = async (params?: ListFriendliesParams): Promise<{ data: FriendlyMatch[]; total: number }> => {
  const qs = new URLSearchParams();
  qs.set("friendly", "true");
  if (params?.season) qs.set("season", params.season);
  if (params?.opponent) qs.set("opponent", params.opponent);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  return customFetch<{ data: FriendlyMatch[]; total: number }>(`/api/matches?${qs.toString()}`);
};

export const getFriendliesQueryKey = (params?: ListFriendliesParams) =>
  ["/api/matches", "friendly", params] as const;

export const useListFriendlies = (params?: ListFriendliesParams) =>
  useQuery({
    queryKey: getFriendliesQueryKey(params),
    queryFn: () => getFriendlies(params),
  });
