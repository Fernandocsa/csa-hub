import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface MatchLineupRow {
  id: number;
  matchId: number;
  side: string;
  playerId: number | null;
  playerName: string;
  role: string;
  shirtNumber: number | null;
  position: string | null;
  sortOrder: number;
}

export interface MatchGoalRow {
  id: number;
  matchId: number;
  side: string;
  scorerLineupId: number | null;
  scorerPlayerId: number | null;
  scorerName: string;
  minute: number;
  injuryTimeMinute: number | null;
  assistLineupId: number | null;
  assistPlayerId: number | null;
  assistName: string | null;
}

export interface MatchCardRow {
  id: number;
  matchId: number;
  side: string;
  cardType: string;
  lineupId: number | null;
  playerId: number | null;
  playerName: string;
  minute: number;
  injuryTimeMinute: number | null;
}

export interface MatchDetailSheet {
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
  manager: string | null;
  scorers: string[];
  attendance: number | null;
  attendancePaid: number | null;
  grossRevenue: number | null;
  grossRevenueText: string | null;
  isWalkover: boolean;
  isFriendly?: boolean;
  isUnknownResult: boolean;
  lineups: MatchLineupRow[];
  goals: MatchGoalRow[];
  cards: MatchCardRow[];
}

export const getMatchDetail = (id: number) =>
  customFetch<MatchDetailSheet>(`/api/matches/${id}`);

export const getMatchDetailQueryKey = (id: number) =>
  [`/api/matches/${id}`] as const;

export const useGetMatchDetail = (id: number) =>
  useQuery({
    queryKey: getMatchDetailQueryKey(id),
    queryFn: () => getMatchDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });
