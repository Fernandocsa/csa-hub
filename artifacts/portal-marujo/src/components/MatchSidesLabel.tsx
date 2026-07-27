import { OpponentCrest, CsaCrest } from "@/components/OpponentCrest";

/**
 * CSA × Opponent (or reverse) for match/game rows.
 * Opponent crest comes AFTER the Nome-UF (match lists / match detail only).
 */
export function MatchSidesLabel({
  homeAway,
  opponent,
  logoUrl,
  separator = "×",
}: {
  homeAway: string;
  opponent: string;
  logoUrl?: string | null;
  separator?: string;
}) {
  const oppCrest = <OpponentCrest url={logoUrl} name={opponent} size="sm" />;
  const csa = (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <CsaCrest size="sm" />
      <span>CSA</span>
    </span>
  );
  const opp = (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="truncate">{opponent}</span>
      {oppCrest}
    </span>
  );
  if (homeAway === "home") {
    return (
      <span className="inline-flex items-center gap-1.5 min-w-0">
        {csa}
        <span className="text-muted-foreground">{separator}</span>
        {opp}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {opp}
      <span className="text-muted-foreground">{separator}</span>
      {csa}
    </span>
  );
}
