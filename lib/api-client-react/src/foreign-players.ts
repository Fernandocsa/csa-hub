import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface ForeignPlayer {
  id: number;
  name: string;
  position: string | null;
  nationality: string;
  nationalityFlag: string | null;
  appearances: number;
  goals: number;
  firstSeason: string | null;
  lastSeason: string | null;
}

export interface NationalitySummary {
  nationality: string;
  nationalityFlag: string | null;
  playerCount: number;
  totalAppearances: number;
  totalGoals: number;
}

export const getForeignPlayers = async (): Promise<ForeignPlayer[]> =>
  customFetch<ForeignPlayer[]>("/api/players/foreign");

export const getForeignPlayersQueryKey = () => ["/api/players/foreign"] as const;

export const useGetForeignPlayers = () =>
  useQuery({
    queryKey: getForeignPlayersQueryKey(),
    queryFn: getForeignPlayers,
  });

export const getNationalities = async (): Promise<NationalitySummary[]> =>
  customFetch<NationalitySummary[]>("/api/players/nationalities");

export const getNationalitiesQueryKey = () => ["/api/players/nationalities"] as const;

export const useGetNationalities = () =>
  useQuery({
    queryKey: getNationalitiesQueryKey(),
    queryFn: getNationalities,
  });

export const getPlayersByNationality = async (country: string): Promise<ForeignPlayer[]> =>
  customFetch<ForeignPlayer[]>(`/api/players/by-nationality/${encodeURIComponent(country)}`);

export const getPlayersByNationalityQueryKey = (country: string) =>
  ["/api/players/by-nationality", country] as const;

export const useGetPlayersByNationality = (country: string) =>
  useQuery({
    queryKey: getPlayersByNationalityQueryKey(country),
    queryFn: () => getPlayersByNationality(country),
    enabled: !!country,
  });
