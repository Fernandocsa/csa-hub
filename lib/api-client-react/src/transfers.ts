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
  /** Linked adversary id when available — opens /adversarios/:id */
  opponentId?: number | null;
  clubLogoUrl?: string | null;
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
  /** Only loan-type movements (empréstimo / emprestimo / loan). */
  loansOnly?: boolean;
};

export const getTransfers = async (
  query: TransfersQuery = {},
): Promise<TransfersListResponse> => {
  const params = new URLSearchParams();
  if (query.season) params.set("season", query.season);
  if (query.direction === "in" || query.direction === "out") {
    params.set("direction", query.direction);
  }
  if (query.loansOnly) params.set("loansOnly", "1");
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

export const getLatestTransfer = async (): Promise<TransferItem | null> =>
  customFetch<TransferItem | null>("/api/transfers/latest");

export const getLatestTransferQueryKey = () =>
  ["/api/transfers/latest"] as const;

export const useGetLatestTransfer = () =>
  useQuery({
    queryKey: getLatestTransferQueryKey(),
    queryFn: getLatestTransfer,
  });
