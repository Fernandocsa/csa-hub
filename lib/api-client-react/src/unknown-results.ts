import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface UnknownResultMatch {
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
  isUnknownResult: boolean;
  phase?: string | null;
  round?: string | null;
}

export interface ListUnknownResultsParams {
  season?: string;
  opponent?: string;
  limit?: number;
  offset?: number;
}

export const getUnknownResults = async (
  params?: ListUnknownResultsParams
): Promise<{ data: UnknownResultMatch[]; total: number }> => {
  const qs = new URLSearchParams();
  qs.set("unknown", "true");
  if (params?.season) qs.set("season", params.season);
  if (params?.opponent) qs.set("opponent", params.opponent);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  return customFetch<{ data: UnknownResultMatch[]; total: number }>(
    `/api/matches?${qs.toString()}`
  );
};

export const getUnknownResultsQueryKey = (params?: ListUnknownResultsParams) =>
  ["/api/matches", "unknown", params] as const;

export const useListUnknownResults = (params?: ListUnknownResultsParams) =>
  useQuery({
    queryKey: getUnknownResultsQueryKey(params),
    queryFn: () => getUnknownResults(params),
  });
