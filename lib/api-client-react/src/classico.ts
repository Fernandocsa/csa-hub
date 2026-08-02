import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type {
  OpponentCompetitionStat,
  OpponentHighlightEntry,
  OpponentHighlights,
  OpponentMarginMatch,
  OpponentRepeatedScoreline,
} from "./generated/api.schemas";

export type {
  OpponentCompetitionStat,
  OpponentHighlightEntry,
  OpponentHighlights,
  OpponentMarginMatch,
  OpponentRepeatedScoreline,
};

export interface ClassicoMatchRow {
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
  phase: string | null;
  round: string | null;
  attendance?: number | null;
}

export interface ClassicoAttendanceRow {
  id: number;
  date: string;
  season: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competition: string;
  stadium: string | null;
  attendance: number;
}

export interface ClassicoResponse {
  title: string;
  subtitle: string;
  opponentId: number;
  opponentName: string;
  opponentLogoUrl: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  competitionStats: OpponentCompetitionStat[];
  highlights: OpponentHighlights | null;
  homeRecord: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  awayRecord: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  allMatches: ClassicoMatchRow[];
  biggestVictory: OpponentMarginMatch | null;
  biggestDefeat: OpponentMarginMatch | null;
  mostRepeatedScorelines: OpponentRepeatedScoreline[];
  biggestAttendances: ClassicoAttendanceRow[];
}

export const getClassico = async (): Promise<ClassicoResponse> =>
  customFetch<ClassicoResponse>("/api/classico");

export const getClassicoQueryKey = () => ["/api/classico"] as const;

export const useGetClassico = () =>
  useQuery({
    queryKey: getClassicoQueryKey(),
    queryFn: getClassico,
  });
