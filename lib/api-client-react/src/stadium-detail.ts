import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

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
