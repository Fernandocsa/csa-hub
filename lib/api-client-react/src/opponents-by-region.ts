import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type OpponentRegionAggregate = {
  region: string;
  slug: string;
  stateCount: number;
  opponentCount: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type OpponentsByRegionList = {
  regions: OpponentRegionAggregate[];
};

export type OpponentRegionStateBreakdown = {
  state: string;
  opponentCount: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type OpponentRegionTeam = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type OpponentsByRegionDetail = {
  region: string;
  slug: string;
  states: string[];
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  opponentCount: number;
  statesBreakdown: OpponentRegionStateBreakdown[];
  opponents: OpponentRegionTeam[];
};

export const getOpponentsByRegion = () =>
  customFetch<OpponentsByRegionList>("/api/opponents/by-region");

export const getOpponentsByRegionQueryKey = () =>
  ["/api/opponents/by-region"] as const;

export const useGetOpponentsByRegion = () =>
  useQuery({
    queryKey: getOpponentsByRegionQueryKey(),
    queryFn: getOpponentsByRegion,
  });

export const getOpponentsByRegionDetail = (slug: string) =>
  customFetch<OpponentsByRegionDetail>(
    `/api/opponents/by-region/${encodeURIComponent(slug)}`,
  );

export const getOpponentsByRegionDetailQueryKey = (slug: string) =>
  [`/api/opponents/by-region/${slug}`] as const;

export const useGetOpponentsByRegionDetail = (slug: string) =>
  useQuery({
    queryKey: getOpponentsByRegionDetailQueryKey(slug),
    queryFn: () => getOpponentsByRegionDetail(slug),
    enabled: !!slug,
  });
