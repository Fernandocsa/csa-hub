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
  grossRevenueText: string | null;
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

export type AttendanceSortBy = "attendance" | "attendance_paid" | "gross_revenue";

export const getBiggestAttendance = async (
  limit?: number,
  sortBy?: AttendanceSortBy,
): Promise<AttendanceMatch[]> => {
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  if (sortBy && sortBy !== "attendance") qs.set("sort_by", sortBy);
  const q = qs.toString();
  return customFetch<AttendanceMatch[]>(`/api/matches/biggest-attendance${q ? `?${q}` : ""}`);
};

export const getBiggestAttendanceQueryKey = (limit?: number, sortBy?: AttendanceSortBy) =>
  ["/api/matches/biggest-attendance", limit, sortBy ?? "attendance"] as const;

export const useGetBiggestAttendance = (limit?: number, sortBy?: AttendanceSortBy) =>
  useQuery({
    queryKey: getBiggestAttendanceQueryKey(limit, sortBy),
    queryFn: () => getBiggestAttendance(limit, sortBy),
  });

export const getTopAssists = async (
  limitOrOpts?: number | { limit?: number; season?: string },
): Promise<TopAssistPlayer[]> => {
  const opts =
    typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts;
  const qs = new URLSearchParams();
  if (opts?.limit) qs.set("limit", String(opts.limit));
  if (opts?.season) qs.set("season", opts.season);
  const q = qs.toString();
  return customFetch<TopAssistPlayer[]>(`/api/players/top-assists${q ? `?${q}` : ""}`);
};

export const getTopAssistsQueryKey = (
  limitOrOpts?: number | { limit?: number; season?: string },
) => {
  const opts =
    typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts;
  return ["/api/players/top-assists", opts?.limit, opts?.season ?? "all"] as const;
};

export const useGetTopAssists = (
  limitOrOpts?: number | { limit?: number; season?: string },
) =>
  useQuery({
    queryKey: getTopAssistsQueryKey(limitOrOpts),
    queryFn: () => getTopAssists(limitOrOpts),
  });
