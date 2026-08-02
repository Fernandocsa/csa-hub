import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type TransferDirection = "in" | "out";

export interface TransferItem {
  id: number;
  playerId: number;
  playerName: string;
  playerPhotoUrl: string | null;
  direction: TransferDirection;
  club: string | null;
  transferDate: string | null;
  season: string;
  transferType: string | null;
  notes: string | null;
}

export interface TransfersListResponse {
  transfers: TransferItem[];
  seasons: string[];
}

export type TransfersQuery = {
  season?: string;
  direction?: TransferDirection | "";
};

export const getTransfers = async (
  query: TransfersQuery = {},
): Promise<TransfersListResponse> => {
  const params = new URLSearchParams();
  if (query.season) params.set("season", query.season);
  if (query.direction === "in" || query.direction === "out") {
    params.set("direction", query.direction);
  }
  const qs = params.toString();
  return customFetch<TransfersListResponse>(
    `/api/transfers${qs ? `?${qs}` : ""}`,
  );
};

export const getTransfersQueryKey = (query: TransfersQuery = {}) =>
  ["/api/transfers", query] as const;

export const useGetTransfers = (query: TransfersQuery = {}) =>
  useQuery({
    queryKey: getTransfersQueryKey(query),
    queryFn: () => getTransfers(query),
  });
