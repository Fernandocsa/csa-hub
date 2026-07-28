import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type RefereeListItem = {
  id: number;
  name: string;
  state: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
};

export type RefereeMatchRecord = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type RefereeMatchRow = {
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
};

export type RefereeDetail = {
  id: number;
  name: string;
  state: string | null;
  photoUrl?: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  homeRecord: RefereeMatchRecord;
  awayRecord: RefereeMatchRecord;
  allMatches: RefereeMatchRow[];
};

export const getListReferees = (search?: string) => {
  const q = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  return customFetch<RefereeListItem[]>(`/api/referees${q}`);
};

export const getListRefereesQueryKey = (search?: string) =>
  ["/api/referees", search ?? ""] as const;

export const useListReferees = (search?: string) =>
  useQuery({
    queryKey: getListRefereesQueryKey(search),
    queryFn: () => getListReferees(search),
  });

export const getReferee = (id: number) =>
  customFetch<RefereeDetail>(`/api/referees/${id}`);

export const getRefereeQueryKey = (id: number) =>
  [`/api/referees/${id}`] as const;

export const useGetReferee = (id: number) =>
  useQuery({
    queryKey: getRefereeQueryKey(id),
    queryFn: () => getReferee(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export type RefereeStateAggregate = {
  state: string | null;
  refereeCount: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type RefereesByStateList = {
  states: RefereeStateAggregate[];
  unknown: RefereeStateAggregate | null;
};

export type RefereeStateReferee = {
  id: number;
  name: string;
  state: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type RefereesByStateDetail = {
  state: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  refereeCount: number;
  homeRecord: RefereeMatchRecord;
  awayRecord: RefereeMatchRecord;
  referees: RefereeStateReferee[];
};

export const getRefereesByState = () =>
  customFetch<RefereesByStateList>("/api/referees/by-state");

export const getRefereesByStateQueryKey = () =>
  ["/api/referees/by-state"] as const;

export const useGetRefereesByState = () =>
  useQuery({
    queryKey: getRefereesByStateQueryKey(),
    queryFn: getRefereesByState,
  });

export const getRefereesByStateDetail = (uf: string) =>
  customFetch<RefereesByStateDetail>(
    `/api/referees/by-state/${encodeURIComponent(uf)}`,
  );

export const getRefereesByStateDetailQueryKey = (uf: string) =>
  [`/api/referees/by-state/${uf}`] as const;

export const useGetRefereesByStateDetail = (uf: string) =>
  useQuery({
    queryKey: getRefereesByStateDetailQueryKey(uf),
    queryFn: () => getRefereesByStateDetail(uf),
    enabled: !!uf,
  });
