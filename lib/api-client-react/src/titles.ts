import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface TitlesCompetition {
  competitionId: number;
  competitionName: string;
  count: number;
  seasons: string[];
}

export interface TitlesResponse {
  total: number;
  competitions: TitlesCompetition[];
}

export const getTitles = async (): Promise<TitlesResponse> =>
  customFetch<TitlesResponse>("/api/titles");

export const getTitlesQueryKey = () => ["/api/titles"] as const;

export const useGetTitles = () =>
  useQuery({
    queryKey: getTitlesQueryKey(),
    queryFn: getTitles,
  });
