import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type OpponentStateAggregate = {
  state: string | null;
  opponentCount: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type OpponentsByStateList = {
  states: OpponentStateAggregate[];
  unknown: OpponentStateAggregate | null;
};

export type OpponentStateTeam = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  /** @nullable */
  logoUrl?: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type OpponentsByStateDetail = {
  state: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  opponentCount: number;
  opponents: OpponentStateTeam[];
};

export const getOpponentsByState = () =>
  customFetch<OpponentsByStateList>("/api/opponents/by-state");

export const getOpponentsByStateQueryKey = () =>
  ["/api/opponents/by-state"] as const;

export const useGetOpponentsByState = () =>
  useQuery({
    queryKey: getOpponentsByStateQueryKey(),
    queryFn: getOpponentsByState,
  });

export const getOpponentsByStateDetail = (uf: string) =>
  customFetch<OpponentsByStateDetail>(
    `/api/opponents/by-state/${encodeURIComponent(uf)}`,
  );

export const getOpponentsByStateDetailQueryKey = (uf: string) =>
  [`/api/opponents/by-state/${uf}`] as const;

export const useGetOpponentsByStateDetail = (uf: string) =>
  useQuery({
    queryKey: getOpponentsByStateDetailQueryKey(uf),
    queryFn: () => getOpponentsByStateDetail(uf),
    enabled: !!uf,
  });
