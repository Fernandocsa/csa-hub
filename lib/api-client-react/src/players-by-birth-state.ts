import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type BirthStateSummary = {
  state: string | null;
  playerCount: number;
  totalAppearances: number;
  totalGoals: number;
};

export type PlayersByBirthStateList = {
  states: BirthStateSummary[];
  unknown: BirthStateSummary | null;
};

export type BirthStatePlayer = {
  id: number;
  name: string;
  position: string | null;
  birthCity: string | null;
  birthState: string | null;
  nationality: string | null;
  nationalityFlag: string | null;
  appearances: number;
  goals: number;
  firstSeason: string | null;
  lastSeason: string | null;
};

export type PlayersByBirthStateDetail = {
  state: string | null;
  playerCount: number;
  totalAppearances: number;
  totalGoals: number;
  players: BirthStatePlayer[];
};

export const getPlayersByBirthState = () =>
  customFetch<PlayersByBirthStateList>("/api/players/by-birth-state");

export const getPlayersByBirthStateQueryKey = () =>
  ["/api/players/by-birth-state"] as const;

export const useGetPlayersByBirthState = () =>
  useQuery({
    queryKey: getPlayersByBirthStateQueryKey(),
    queryFn: getPlayersByBirthState,
  });

export const getPlayersByBirthStateDetail = (uf: string) =>
  customFetch<PlayersByBirthStateDetail>(
    `/api/players/by-birth-state/${encodeURIComponent(uf)}`,
  );

export const getPlayersByBirthStateDetailQueryKey = (uf: string) =>
  [`/api/players/by-birth-state/${uf}`] as const;

export const useGetPlayersByBirthStateDetail = (uf: string) =>
  useQuery({
    queryKey: getPlayersByBirthStateDetailQueryKey(uf),
    queryFn: () => getPlayersByBirthStateDetail(uf),
    enabled: !!uf,
  });
