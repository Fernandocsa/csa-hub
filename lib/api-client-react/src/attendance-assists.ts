import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface AttendanceMatch {
  id: number;
  date: string;
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  competition: string;
  season: string;
  stadium: string | null;
  attendance: number;
  attendancePaid: number | null;
  grossRevenue: number | null;
}

export interface TopAssistPlayer {
  id: number;
  name: string;
  position: string | null;
  nationality: string | null;
  nationalityFlag: string | null;
  appearances: number;
  goals: number;
  assists: number;
}

export const getBiggestAttendance = async (limit?: number): Promise<AttendanceMatch[]> =>
  customFetch<AttendanceMatch[]>(`/api/matches/biggest-attendance${limit ? `?limit=${limit}` : ""}`);

export const getBiggestAttendanceQueryKey = (limit?: number) =>
  ["/api/matches/biggest-attendance", limit] as const;

export const useGetBiggestAttendance = (limit?: number) =>
  useQuery({
    queryKey: getBiggestAttendanceQueryKey(limit),
    queryFn: () => getBiggestAttendance(limit),
  });

export const getTopAssists = async (limit?: number): Promise<TopAssistPlayer[]> =>
  customFetch<TopAssistPlayer[]>(`/api/players/top-assists${limit ? `?limit=${limit}` : ""}`);

export const getTopAssistsQueryKey = (limit?: number) =>
  ["/api/players/top-assists", limit] as const;

export const useGetTopAssists = (limit?: number) =>
  useQuery({
    queryKey: getTopAssistsQueryKey(limit),
    queryFn: () => getTopAssists(limit),
  });
