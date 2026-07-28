import { Link, useParams } from "wouter";
import {
  useGetMatchDetail,
  type MatchCardRow,
  type MatchGoalRow,
  type MatchLineupRow,
  type MatchSubstitutionRow,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { ChevronLeft } from "lucide-react";
import { sortLineupByPosition } from "@/lib/position-groups";
import { StarRating } from "@/components/StarRating";
import { EntityComments } from "@/components/EntityComments";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { OpponentCrest, CsaCrest } from "@/components/OpponentCrest";
import { ShareButton } from "@/components/ShareButton";

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

function fmtMinute(minute: number, injury: number | null | undefined) {
  if (injury != null && injury > 0) return `${minute}+${injury}'`;
  return `${minute}'`;
}

type PlayerEvent = {
  kind: "goal" | "assist" | "yellow" | "red" | "sub_out" | "sub_in";
  minute: number;
  injuryTimeMinute: number | null;
};

function eventsForPlayer(
  playerId: number | null,
  playerName: string,
  goals: MatchGoalRow[],
  cards: MatchCardRow[],
  substitutions: MatchSubstitutionRow[],
): PlayerEvent[] {
  const events: PlayerEvent[] = [];
  for (const g of goals) {
    if (
      (playerId != null && g.scorerPlayerId === playerId) ||
      (!playerId && g.scorerName === playerName)
    ) {
      events.push({
        kind: "goal",
        minute: g.minute,
        injuryTimeMinute: g.injuryTimeMinute,
      });
    }
    if (
      g.assistPlayerId != null &&
      ((playerId != null && g.assistPlayerId === playerId) ||
        (!playerId && g.assistName === playerName))
    ) {
      events.push({
        kind: "assist",
        minute: g.minute,
        injuryTimeMinute: g.injuryTimeMinute,
      });
    }
  }
  for (const c of cards) {
    if (
      (playerId != null && c.playerId === playerId) ||
      (!playerId && c.playerName === playerName)
    ) {
      events.push({
        kind: c.cardType === "red" ? "red" : "yellow",
        minute: c.minute,
        injuryTimeMinute: c.injuryTimeMinute,
      });
    }
  }
  for (const s of substitutions) {
    if (
      (playerId != null && s.playerOutId === playerId) ||
      (!playerId && s.playerOutName === playerName)
    ) {
      events.push({
        kind: "sub_out",
        minute: s.minute,
        injuryTimeMinute: s.injuryTimeMinute,
      });
    }
    if (
      (playerId != null && s.playerInId === playerId) ||
      (!playerId && s.playerInName === playerName)
    ) {
      events.push({
        kind: "sub_in",
        minute: s.minute,
        injuryTimeMinute: s.injuryTimeMinute,
      });
    }
  }
  return events.sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.injuryTimeMinute ?? 0) - (b.injuryTimeMinute ?? 0);
  });
}

function eventTitle(kind: PlayerEvent["kind"]) {
  switch (kind) {
    case "goal":
      return "Gol";
    case "assist":
      return "Assistência";
    case "red":
      return "Cartão vermelho";
    case "yellow":
      return "Cartão amarelo";
    case "sub_out":
      return "Saiu";
    case "sub_in":
      return "Entrou";
  }
}

function EventIcons({ events }: { events: PlayerEvent[] }) {
  if (events.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 ml-2">
      {events.map((e, i) => (
        <span
          key={`${e.kind}-${e.minute}-${e.injuryTimeMinute}-${i}`}
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
          title={eventTitle(e.kind)}
        >
          {e.kind === "goal" && <span aria-hidden>⚽</span>}
          {e.kind === "assist" && (
            <span aria-hidden className="font-bold text-[10px] border rounded px-0.5 leading-none">
              A
            </span>
          )}
          {e.kind === "yellow" && (
            <span
              aria-hidden
              className="inline-block w-2.5 h-3.5 rounded-[1px] bg-amber-400 border border-amber-600/40"
            />
          )}
          {e.kind === "red" && (
            <span
              aria-hidden
              className="inline-block w-2.5 h-3.5 rounded-[1px] bg-red-600 border border-red-800/40"
            />
          )}
          {e.kind === "sub_out" && (
            <span aria-hidden className="font-semibold text-red-600/90">
              ↓
            </span>
          )}
          {e.kind === "sub_in" && (
            <span aria-hidden className="font-semibold text-emerald-700/90">
              ↑
            </span>
          )}
          <span className="tabular-nums">{fmtMinute(e.minute, e.injuryTimeMinute)}</span>
        </span>
      ))}
    </span>
  );
}

function LineupList({
  title,
  players,
  goals,
  cards,
  substitutions,
}: {
  title: string;
  players: MatchLineupRow[];
  goals: MatchGoalRow[];
  cards: MatchCardRow[];
  substitutions: MatchSubstitutionRow[];
}) {
  if (players.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      <ul className="border rounded divide-y">
        {players.map((p) => {
          const events = eventsForPlayer(
            p.playerId,
            p.playerName,
            goals,
            cards,
            substitutions,
          );
          const nameEl =
            p.playerId != null ? (
              <Link
                href={`/jogadores/${p.playerId}`}
                className="font-medium truncate hover:text-primary hover:underline"
              >
                {p.playerName}
              </Link>
            ) : (
              <span className="font-medium truncate">{p.playerName}</span>
            );
          return (
            <li
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <span className="w-7 text-center text-xs tabular-nums text-muted-foreground shrink-0">
                {p.shirtNumber != null ? p.shirtNumber : "—"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1">
                  {nameEl}
                  <EventIcons events={events} />
                </div>
                {p.position && (
                  <span className="text-xs text-muted-foreground">{p.position}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TeamName({
  name,
  isCsa,
  opponentId,
  logoUrl,
}: {
  name: string;
  isCsa: boolean;
  opponentId: number;
  logoUrl?: string | null;
}) {
  if (isCsa) {
    return (
      <span className="inline-flex items-center gap-2">
        <CsaCrest size="md" />
        {name}
      </span>
    );
  }
  return (
    <Link
      href={`/adversarios/${opponentId}`}
      className="inline-flex items-center gap-2 hover:text-primary hover:underline"
    >
      {name}
      <OpponentCrest url={logoUrl} name={name} size="md" />
    </Link>
  );
}

export default function MatchDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data: match, isLoading, isError } = useGetMatchDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="space-y-3 max-w-3xl">
        <Link href="/partidas">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Partidas
          </span>
        </Link>
        <p className="text-destructive">Partida não encontrada.</p>
      </div>
    );
  }

  const csaLineups = (match.lineups ?? []).filter((l) => l.side === "csa");
  const starters = sortLineupByPosition(
    csaLineups.filter((l) => l.role === "starter"),
  );
  const bench = sortLineupByPosition(
    csaLineups.filter((l) => l.role === "bench"),
  );
  const goals = (match.goals ?? []).filter((g) => g.side === "csa");
  const cards = (match.cards ?? []).filter((c) => c.side === "csa");
  const substitutions = (match.substitutions ?? []).filter(
    (s) => s.side === "csa",
  );
  const hasLineup = csaLineups.length > 0;
  const hasAnySheet =
    csaLineups.length > 0 ||
    goals.length > 0 ||
    cards.length > 0 ||
    substitutions.length > 0;
  const scorersText = Array.isArray(match.scorers) ? match.scorers : [];

  const isHome = match.homeAway === "home";
  const leftName = isHome ? "CSA" : match.opponent;
  const rightName = isHome ? match.opponent : "CSA";
  const leftIsCsa = isHome;
  const rightIsCsa = !isHome;
  const leftGoals = isHome ? match.goalsFor : match.goalsAgainst;
  const rightGoals = isHome ? match.goalsAgainst : match.goalsFor;
  const isUnknown = match.isUnknownResult || match.result === "unknown";
  const isScheduled = match.isScheduled === true || match.status === "scheduled";
  const scoreLeft = isScheduled ? "–" : isUnknown ? "?" : leftGoals ?? "–";
  const scoreRight = isScheduled ? "–" : isUnknown ? "?" : rightGoals ?? "–";
  const scoreSep = isScheduled ? "×" : "–";

  const trainerBlock =
    match.manager && match.managerId != null ? (
      <p className="text-sm">
        <span className="text-muted-foreground">Treinador:</span>{" "}
        <Link
          href={`/tecnicos/${match.managerId}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {match.manager}
        </Link>
      </p>
    ) : match.manager ? (
      <p className="text-sm">
        <span className="text-muted-foreground">Treinador:</span>{" "}
        <span className="font-medium">{match.manager}</span>
      </p>
    ) : null;

  const refereeBlock =
    match.referee && match.refereeId != null ? (
      <p className="text-sm">
        <span className="text-muted-foreground">Árbitro:</span>{" "}
        <Link
          href={`/arbitros/${match.refereeId}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {match.referee}
        </Link>
      </p>
    ) : match.referee ? (
      <p className="text-sm">
        <span className="text-muted-foreground">Árbitro:</span>{" "}
        <span className="font-medium">{match.referee}</span>
      </p>
    ) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/partidas">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Partidas
        </span>
      </Link>

      {/* Header — always shown */}
      <div className="border-b pb-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {fmtDate(match.date)} ·{" "}
          <Link
            href={`/competicoes/${match.competitionId}`}
            className="hover:text-foreground hover:underline"
          >
            {match.competition}
          </Link>
          {matchPhaseRoundLabel(match.phase, match.round) && (
            <> · {matchPhaseRoundLabel(match.phase, match.round)}</>
          )}
          {match.stadium && match.stadiumId != null ? (
            <>
              {" · "}
              <Link
                href={`/estadios/${match.stadiumId}`}
                className="hover:text-foreground hover:underline"
              >
                {match.stadium}
              </Link>
            </>
          ) : match.stadium ? (
            <> · {match.stadium}</>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">
            <TeamName
              name={leftName}
              isCsa={leftIsCsa}
              opponentId={match.opponentId}
              logoUrl={match.opponentLogoUrl}
            />{" "}
            <span className="font-mono tabular-nums mx-1">
              {scoreLeft}
              <span className="text-muted-foreground font-normal mx-0.5">{scoreSep}</span>
              {scoreRight}
            </span>{" "}
            <TeamName
              name={rightName}
              isCsa={rightIsCsa}
              opponentId={match.opponentId}
              logoUrl={match.opponentLogoUrl}
            />
          </h1>
          <ShareButton
            title={
              isScheduled || isUnknown
                ? `CSA x ${match.opponent}`
                : `CSA ${match.goalsFor ?? "–"}-${match.goalsAgainst ?? "–"} ${match.opponent}`
            }
          />
          {isScheduled ? (
            <span className="text-xs uppercase tracking-wider text-muted-foreground border rounded px-2 py-0.5">
              Ainda não jogado
            </span>
          ) : !isUnknown && match.result !== "unknown" ? (
            <ResultBadge result={match.result as "win" | "draw" | "loss"} />
          ) : null}
        </div>
        {match.penaltiesFor != null && match.penaltiesAgainst != null && (
          <p className="text-sm font-medium" data-testid="match-penalties">
            Pênaltis:{" "}
            <span className="font-mono tabular-nums">
              {isHome ? match.penaltiesFor : match.penaltiesAgainst}
              <span className="text-muted-foreground font-normal mx-0.5">×</span>
              {isHome ? match.penaltiesAgainst : match.penaltiesFor}
            </span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Temporada{" "}
          <Link
            href={`/temporadas/${match.season}`}
            className="hover:text-foreground hover:underline"
          >
            {match.season}
          </Link>
          {match.homeAway === "home"
            ? " · Casa"
            : match.homeAway === "away"
              ? " · Fora"
              : " · Neutro"}
        </p>
      </div>

      <StarRating entityType="match" entityId={match.id} />

      {/* Empty sheet: explain why escalação / eventos estão ausentes */}
      {!hasAnySheet && (
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
        >
          Ainda não temos a ficha completa desse jogo.
        </div>
      )}

      {/* Legacy scorers text — only if present */}
      {scorersText.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Gols (registro textual)
          </h2>
          <p className="text-sm">{scorersText.join(", ")}</p>
        </div>
      )}

      {/* Escalação CSA — omitted entirely when empty */}
      {hasLineup && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Escalação CSA
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LineupList
              title="Titulares"
              players={starters}
              goals={goals}
              cards={cards}
              substitutions={substitutions}
            />
            <LineupList
              title="Reservas"
              players={bench}
              goals={goals}
              cards={cards}
              substitutions={substitutions}
            />
          </div>
          {trainerBlock}
          {refereeBlock}
          <p className="text-xs text-muted-foreground">
            ⚽ gol · A assistência · retângulo amarelo/vermelho cartão · ↓ saiu · ↑ entrou ·
            minuto ao lado
          </p>
        </section>
      )}

      {/* Treinador / árbitro when there is no lineup section */}
      {!hasLineup && (
        <>
          {trainerBlock}
          {refereeBlock}
        </>
      )}

      <EntityComments entityType="match" entityId={match.id} />
      <EntitySuggestionForm entityType="match" entityId={match.id} />
    </div>
  );
}
