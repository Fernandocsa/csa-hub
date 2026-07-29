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
  /** @nullable */
  photoUrl?: string | null;
  /** @nullable */
  nationality?: string | null;
  /** @nullable */
  nationalityFlag?: string | null;
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

export interface MatchSubstitutionRow {
  id: number;
  matchId: number;
  side: string;
  playerOutLineupId: number | null;
  playerOutId: number | null;
  playerOutName: string;
  playerInLineupId: number | null;
  playerInId: number | null;
  playerInName: string;
  minute: number;
  injuryTimeMinute: number | null;
}

export interface MatchDetailSheet {
  id: number;
  date: string;
  opponentId: number;
  opponent: string;
  /** @nullable */
  opponentLogoUrl?: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competitionId: number;
  competition: string;
  season: string;
  stadiumId: number | null;
  stadium: string | null;
  managerId: number | null;
  manager: string | null;
  refereeId: number | null;
  referee: string | null;
  scorers: string[];
  attendance: number | null;
  attendancePaid: number | null;
  grossRevenue: number | null;
  grossRevenueText: string | null;
  isWalkover: boolean;
  isFriendly?: boolean;
  isUnknownResult: boolean;
  isScheduled?: boolean;
  status?: string;
  phase?: string | null;
  round?: string | null;
  /** CSA penalties in shootout; null when there was no shootout. */
  penaltiesFor?: number | null;
  /** Opponent penalties in shootout. */
  penaltiesAgainst?: number | null;
  relatedMatchId?: number | null;
  relatedMatch?: {
    id: number;
    date: string;
    opponent: string;
    goalsFor: number | null;
    goalsAgainst: number | null;
    round: string | null;
    phase: string | null;
  } | null;
  lineups: MatchLineupRow[];
  goals: MatchGoalRow[];
  cards: MatchCardRow[];
  substitutions: MatchSubstitutionRow[];
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
