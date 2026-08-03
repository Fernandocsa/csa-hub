import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface StadiumMatchRow {
  id: number;
  date: string;
  opponentId: number;
  opponent: string;
  opponentLogoUrl?: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competition: string;
  season: string;
  phase?: string | null;
  round?: string | null;
}

export interface StadiumOpponentFaced {
  id: number;
  name: string;
  logoUrl?: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface StadiumDetail {
  id: number;
  name: string;
  city: string | null;
  state?: string | null;
  capacity: number | null;
  photoUrl?: string | null;
  homeClubs?: { id: number; name: string }[];
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  winPercentage: number;
  firstMatch: string | null;
  lastMatch: string | null;
  opponentsFaced?: StadiumOpponentFaced[];
  allMatches?: StadiumMatchRow[];
}

export const getStadiumDetail = (id: number) =>
  customFetch<StadiumDetail>(`/api/stadiums/${id}`);

export const getStadiumDetailQueryKey = (id: number) =>
  [`/api/stadiums/${id}`] as const;

export const useGetStadiumDetail = (id: number) =>
  useQuery({
    queryKey: getStadiumDetailQueryKey(id),
    queryFn: () => getStadiumDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });
