import { OpponentCrest, CsaCrest } from "@/components/OpponentCrest";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";

/**
 * CSA × Opponent (or reverse) for match/game rows.
 * Crest sits on the outer edge: before CSA always; after opponent when CSA is home,
 * before opponent when CSA is away (left side always reads crest → name).
 * When opponentId/matchId are set, opponent → histórico and score separator → partida.
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
      <CsaCrest size="sm" />
      <span>CSA</span>
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
