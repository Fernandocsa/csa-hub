import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface AttendanceMatch {
  id: number;
  date: string;
  opponent: string;
  /** @nullable */
  opponentLogoUrl?: string | null;
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
