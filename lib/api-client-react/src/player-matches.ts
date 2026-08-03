import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface PlayerSheetMatch {
  matchId: number;
  date: string;
  season: string;
  opponentId?: number;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competition?: string | null;
  competitionType?: string | null;
  phase?: string | null;
  round?: string | null;
  role: string;
  shirtNumber: number | null;
  position: string | null;
  playerGoals: number;
  playerAssists: number;
  yellowCards: number;
  redCards: number;
  minuteIn: number | null;
  minuteInInjury: number | null;
  minuteOut: number | null;
  minuteOutInjury: number | null;
}

export interface PlayerMatchesResponse {
  playerId: number;
  playerName: string;
  /** Matches with sheet participation (starter or sub who entered). */
  total: number;
  /** Career total using season floors (may exceed `total` when sheets are incomplete). */
  careerAppearances?: number;
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
