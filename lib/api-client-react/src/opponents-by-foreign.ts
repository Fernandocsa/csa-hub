import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type ForeignAggregate = {
  opponentCount: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type ForeignCountryAggregate = ForeignAggregate & {
  code: string;
  name: string;
};

export type ForeignOpponentTeam = ForeignAggregate & {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  countryName: string | null;
};

export type OpponentsByForeign = {
  overall: ForeignAggregate;
  countries: ForeignCountryAggregate[];
  opponents: ForeignOpponentTeam[];
};

export const getOpponentsByForeign = () =>
  customFetch<OpponentsByForeign>("/api/opponents/by-foreign");

export const getOpponentsByForeignQueryKey = () =>
  ["/api/opponents/by-foreign"] as const;

export const useGetOpponentsByForeign = () =>
  useQuery({
    queryKey: getOpponentsByForeignQueryKey(),
    queryFn: getOpponentsByForeign,
  });
