import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface WalkoverMatch {
  id: number;
  date: string;
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  competition: string;
  season: string;
  stadium: string | null;
  isWalkover: boolean;
}

export interface ListWalkoversParams {
  season?: string;
  opponent?: string;
  limit?: number;
  offset?: number;
}

export const getWalkovers = async (params?: ListWalkoversParams): Promise<{ data: WalkoverMatch[]; total: number }> => {
  const qs = new URLSearchParams();
  qs.set("walkover", "true");
  if (params?.season) qs.set("season", params.season);
  if (params?.opponent) qs.set("opponent", params.opponent);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  return customFetch<{ data: WalkoverMatch[]; total: number }>(`/api/matches?${qs.toString()}`);
};

export const getWalkoversQueryKey = (params?: ListWalkoversParams) =>
  ["/api/matches", "walkover", params] as const;

export const useListWalkovers = (params?: ListWalkoversParams) =>
  useQuery({
    queryKey: getWalkoversQueryKey(params),
    queryFn: () => getWalkovers(params),
  });
