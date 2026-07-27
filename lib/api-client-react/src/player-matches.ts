import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface PlayerSheetMatch {
  matchId: number;
  date: string;
  season: string;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  role: string;
  shirtNumber: number | null;
  position: string | null;
}

export interface PlayerMatchesResponse {
  playerId: number;
  playerName: string;
  total: number;
  matches: PlayerSheetMatch[];
}

export const getPlayerMatches = (id: number) =>
  customFetch<PlayerMatchesResponse>(`/api/players/${id}/matches`);

export const getPlayerMatchesQueryKey = (id: number) =>
  [`/api/players/${id}/matches`] as const;

export const useGetPlayerMatches = (id: number) =>
  useQuery({
    queryKey: getPlayerMatchesQueryKey(id),
    queryFn: () => getPlayerMatches(id),
    enabled: Number.isFinite(id) && id > 0,
  });
