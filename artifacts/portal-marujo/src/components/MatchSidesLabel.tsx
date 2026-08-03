import { CsaCrest } from "@/components/OpponentCrest";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";

/**
 * CSA × Opponent (or reverse) for match/game rows.
 * Crests sit on the outer edges: before the left team, after the right team.
 * Home: [CSA] CSA · Opp [Opp]
 * Away: [Opp] Opp · CSA [CSA]
 */
export function MatchSidesLabel({
  homeAway,
  opponent,
  opponentId,
  matchId,
  logoUrl,
  separator = "×",
}: {
  homeAway: string;
  opponent: string;
  opponentId?: number | null;
  matchId?: number | null;
  logoUrl?: string | null;
  separator?: string;
}) {
  const isHome = homeAway === "home";
  const csa = (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      {isHome && <CsaCrest size="sm" />}
      <span>CSA</span>
      {!isHome && <CsaCrest size="sm" />}
    </span>
  );
  const opp = (
    <OpponentHistoryLink
      opponentId={opponentId}
      name={opponent}
      logoUrl={logoUrl}
      crestAfter={isHome}
    />
  );
  const sep =
    matchId != null && separator !== "×" ? (
      <MatchScoreLink matchId={matchId} className="text-muted-foreground font-mono font-normal">
        {separator}
      </MatchScoreLink>
    ) : (
      <span className="text-muted-foreground">{separator}</span>
    );

  if (isHome) {
    return (
      <span className="inline-flex items-center gap-1.5 min-w-0">
        {csa}
        {sep}
        {opp}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {opp}
      {sep}
      {csa}
    </span>
  );
}
