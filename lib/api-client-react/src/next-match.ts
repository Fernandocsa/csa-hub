import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface NextMatch {
  opponent: string;
  matchDate: string;
  competition: string;
  homeAway: "home" | "away" | string;
  stadium: string | null;
  opponentId?: number | null;
  matchId?: number | null;
  /** @nullable */
  opponentLogoUrl?: string | null;
}

export const getNextMatch = async (): Promise<NextMatch | null> =>
  customFetch<NextMatch | null>("/api/next-match");

export const getNextMatchQueryKey = () => ["/api/next-match"] as const;

export const useGetNextMatch = () =>
  useQuery({
    queryKey: getNextMatchQueryKey(),
    queryFn: getNextMatch,
  });
