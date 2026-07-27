export type RatingEntityType = "player" | "manager" | "match";

export type RatingSummary = {
  average: number | null;
  count: number;
  label: string | null;
  myRating: number | null;
};

const VOTER_KEY = "portal-marujo-voter-token";

function votedKey(entityType: RatingEntityType, entityId: number): string {
  return `portal-marujo-rated:${entityType}:${entityId}`;
}

export function getVoterToken(): string {
  try {
    let token = localStorage.getItem(VOTER_KEY);
    if (!token) {
      token =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VOTER_KEY, token);
    }
    return token;
  } catch {
    return `ephemeral-${Date.now()}`;
  }
}

export function getLocalVote(
  entityType: RatingEntityType,
  entityId: number,
): number | null {
  try {
    const raw = localStorage.getItem(votedKey(entityType, entityId));
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
  } catch {
    return null;
  }
}

export function markLocalVote(
  entityType: RatingEntityType,
  entityId: number,
  stars: number,
): void {
  try {
    localStorage.setItem(votedKey(entityType, entityId), String(stars));
  } catch {
    /* ignore quota / private mode */
  }
}

export async function fetchRating(
  entityType: RatingEntityType,
  entityId: number,
): Promise<RatingSummary> {
  const token = getVoterToken();
  const qs = new URLSearchParams({ voterToken: token });
  const res = await fetch(
    `/api/ratings/${entityType}/${entityId}?${qs.toString()}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Erro ao carregar avaliação",
    );
  }
  return res.json();
}

export async function submitRating(
  entityType: RatingEntityType,
  entityId: number,
  stars: number,
): Promise<RatingSummary & { stars: number }> {
  const voterToken = getVoterToken();
  const res = await fetch(`/api/ratings/${entityType}/${entityId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stars, voterToken }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ?? "Erro ao enviar avaliação",
    );
  }
  markLocalVote(entityType, entityId, stars);
  return body as RatingSummary & { stars: number };
}
