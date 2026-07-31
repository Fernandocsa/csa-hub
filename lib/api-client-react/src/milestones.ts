import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface MilestoneMatch {
  id: number;
  date: string;
  opponentId?: number;
  opponent: string;
  /** @nullable */
  opponentLogoUrl?: string | null;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  competition: string;
  season: string;
  stadium: string | null;
}

export interface MatchMilestones {
  first: MilestoneMatch | null;
  last: MilestoneMatch | null;
}

export const getMatchMilestones = async (): Promise<MatchMilestones> =>
  customFetch<MatchMilestones>("/api/matches/milestones");

export const getMatchMilestonesQueryKey = () => ["/api/matches/milestones"] as const;

export const useGetMatchMilestones = () =>
  useQuery({
    queryKey: getMatchMilestonesQueryKey(),
    queryFn: getMatchMilestones,
  });
