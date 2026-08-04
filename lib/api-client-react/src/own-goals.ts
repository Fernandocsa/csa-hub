import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface OwnGoalStat {
  id: number;
  name: string;
  position: string | null;
  nationality: string | null;
  nationalityFlag: string | null;
  verificationStatus?: string | null;
  appearances: number;
  /** Own goals (GPD) count — field name matches PlayerStat for reuse. */
  goals: number;
}

export type GetTopOwnGoalsParams = {
  season?: string;
  limit?: number;
};

export const getTopOwnGoals = async (
  params?: GetTopOwnGoalsParams,
): Promise<OwnGoalStat[]> => {
  const q = new URLSearchParams();
  if (params?.season) q.set("season", params.season);
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return customFetch<OwnGoalStat[]>(
    `/api/players/top-own-goals${qs ? `?${qs}` : ""}`,
  );
};

export const getGetTopOwnGoalsQueryKey = (params?: GetTopOwnGoalsParams) =>
  ["/api/players/top-own-goals", ...(params ? [params] : [])] as const;

export const useGetTopOwnGoals = (params?: GetTopOwnGoalsParams) =>
  useQuery({
    queryKey: getGetTopOwnGoalsQueryKey(params),
    queryFn: () => getTopOwnGoals(params),
  });
