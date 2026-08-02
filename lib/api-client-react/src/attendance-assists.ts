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

/** Currency family for renda rankings (never mix eras). */
export type RevenueCurrency = "real" | "cruzado" | "cruzeiro";

export const getBiggestAttendance = async (
  limit?: number,
  sortBy?: AttendanceSortBy,
  currency?: RevenueCurrency,
): Promise<AttendanceMatch[]> => {
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  if (sortBy && sortBy !== "attendance") qs.set("sort_by", sortBy);
  if (sortBy === "gross_revenue" && currency) qs.set("currency", currency);
  const q = qs.toString();
  return customFetch<AttendanceMatch[]>(`/api/matches/biggest-attendance${q ? `?${q}` : ""}`);
};

export const getBiggestAttendanceQueryKey = (
  limit?: number,
  sortBy?: AttendanceSortBy,
  currency?: RevenueCurrency,
) =>
  [
    "/api/matches/biggest-attendance",
    limit,
    sortBy ?? "attendance",
    sortBy === "gross_revenue" ? (currency ?? "real") : null,
  ] as const;

export const useGetBiggestAttendance = (
  limit?: number,
  sortBy?: AttendanceSortBy,
  currency?: RevenueCurrency,
) =>
  useQuery({
    queryKey: getBiggestAttendanceQueryKey(limit, sortBy, currency),
    queryFn: () => getBiggestAttendance(limit, sortBy, currency),
  });
