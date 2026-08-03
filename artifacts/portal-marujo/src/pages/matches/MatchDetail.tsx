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
import { PlayerFlag } from "@/components/PlayerFlag";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { EntityPhoto } from "@/components/EntityPhoto";
import { ShareButton } from "@/components/ShareButton";
import {
  isUnknownEventMinute,
  UNKNOWN_EVENT_MINUTE_LABEL,
  UNKNOWN_EVENT_MINUTE_TITLE,
} from "@/lib/event-minute";
import { formatDateBr } from "@/lib/utils";

function fmtDate(d: string) {
  return formatDateBr(d);
}

function EventMinute({
  minute,
  injury,
}: {
  minute: number;
  injury: number | null | undefined;
}) {
  if (isUnknownEventMinute(minute)) {
    return (
      <span
        title={UNKNOWN_EVENT_MINUTE_TITLE}
        className="tabular-nums cursor-help underline decoration-dotted"
      >
        {UNKNOWN_EVENT_MINUTE_LABEL}
      </span>
    );
  }
  const label =
    injury != null && injury > 0 ? `${minute}+${injury}'` : `${minute}'`;
  return <span className="tabular-nums">{label}</span>;
}

type PlayerEvent = {
  kind: "goal" | "assist" | "yellow" | "red" | "sub_out" | "sub_in";
  minute: number;
  injuryTimeMinute: number | null;
  isPenalty?: boolean;
  isFreeKick?: boolean;
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
        isPenalty: Boolean(g.isPenalty),
        isFreeKick: Boolean(g.isFreeKick),
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
    const aUnk = isUnknownEventMinute(a.minute);
    const bUnk = isUnknownEventMinute(b.minute);
    if (aUnk !== bUnk) return aUnk ? 1 : -1;
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.injuryTimeMinute ?? 0) - (b.injuryTimeMinute ?? 0);
  });
}

function eventTitle(e: PlayerEvent) {
  switch (e.kind) {
    case "goal":
      if (e.isPenalty) return "Gol de pênalti";
      if (e.isFreeKick) return "Gol de falta";
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
          title={eventTitle(e)}
        >
          {e.kind === "goal" && <span aria-hidden>⚽</span>}
          {e.kind === "goal" && e.isPenalty && (
            <span aria-hidden className="text-[9px] font-semibold uppercase">
              P
            </span>
          )}
          {e.kind === "goal" && e.isFreeKick && (
            <span aria-hidden className="text-[9px] font-semibold uppercase">
              F
            </span>
          )}
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
          <EventMinute minute={e.minute} injury={e.injuryTimeMinute} />
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
  captainPlayerId,
}: {
  title: string;
  players: MatchLineupRow[];
  goals: MatchGoalRow[];
  cards: MatchCardRow[];
  substitutions: MatchSubstitutionRow[];
  captainPlayerId?: number | null;
}) {
  if (players.length === 0) return null;
  const sorted = sortLineupByPosition(players);
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      <ul className="border rounded divide-y">
        {sorted.map((p) => {
          const events = eventsForPlayer(
            p.playerId,
            p.playerName,
            goals,
            cards,
            substitutions,
          );
          const isCaptain =
            captainPlayerId != null &&
            p.playerId != null &&
            p.playerId === captainPlayerId;
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
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <PlayerPhoto url={p.photoUrl} name={p.playerName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1">
                  <PlayerFlag
                    flag={p.nationalityFlag}
                    nationality={p.nationality}
                    size="sm"
                  />
                  {nameEl}
                  {isCaptain && (
                    <span
                      className="inline-flex items-center justify-center h-4 min-w-4 px-0.5 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold leading-none"
                      title="Capitão"
                      aria-label="Capitão"
                    >
                      C
                    </span>
                  )}
                  <EventIcons events={events} />
                </div>
                {p.position && (
                  <span className="text-xs text-muted-foreground">
                    {p.position}
                  </span>
                )}
              </div>
              <span className="shrink-0 w-7 text-right text-xs tabular-nums text-muted-foreground">
                {p.shirtNumber != null ? p.shirtNumber : "—"}
              </span>
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
  crestAfter = false,
}: {
  name: string;
  isCsa: boolean;
  opponentId: number;
  logoUrl?: string | null;
  /** When true, crest sits after the name (right/visitor side). */
  crestAfter?: boolean;
}) {
  const crest = isCsa ? (
    <CsaCrest size="md" />
  ) : (
    <OpponentCrest url={logoUrl} name={name} size="md" />
  );
  const label = <span>{name}</span>;
  const inner = (
    <span className="inline-flex items-center gap-2">
      {!crestAfter && crest}
      {label}
      {crestAfter && crest}
    </span>
  );
  if (isCsa) return inner;
  return (
    <Link
      href={`/adversarios/${opponentId}`}
      className="inline-flex items-center gap-2 hover:text-primary hover:underline"
    >
      {inner}
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
  const starters = csaLineups.filter((l) => l.role === "starter");
  const bench = csaLineups.filter((l) => l.role === "bench");
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
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="text-muted-foreground">Treinador:</span>
        <EntityPhoto
          url={match.managerPhotoUrl}
          name={match.manager}
          size="sm"
          shape="circle"
          label={`Foto de ${match.manager}`}
        />
        <Link
          href={`/tecnicos/${match.managerId}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {match.manager}
        </Link>
      </div>
    ) : match.manager ? (
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="text-muted-foreground">Treinador:</span>
        <EntityPhoto
          url={match.managerPhotoUrl}
          name={match.manager}
          size="sm"
          shape="circle"
          label={`Foto de ${match.manager}`}
        />
        <span className="font-medium">{match.manager}</span>
      </div>
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
              crestAfter={false}
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
              crestAfter
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
        {match.relatedMatch && (
          <p className="text-sm text-muted-foreground" data-testid="match-related">
            {match.relatedMatch.round?.toLowerCase().includes("ida")
              ? "Jogo de ida"
              : match.relatedMatch.round?.toLowerCase().includes("volta")
                ? "Jogo de volta"
                : "Jogo vinculado"}
            :{" "}
            <Link
              href={`/partidas/${match.relatedMatch.id}`}
              className="text-foreground hover:underline font-medium"
            >
              {match.relatedMatch.date} · {match.relatedMatch.opponent}
              {match.relatedMatch.goalsFor != null && match.relatedMatch.goalsAgainst != null
                ? ` ${match.relatedMatch.goalsFor}–${match.relatedMatch.goalsAgainst}`
                : ""}
            </Link>
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
              captainPlayerId={match.captainPlayerId}
            />
            <LineupList
              title="Reservas"
              players={bench}
              goals={goals}
              cards={cards}
              substitutions={substitutions}
              captainPlayerId={match.captainPlayerId}
            />
          </div>
          {trainerBlock}
          {refereeBlock}
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Legenda:</span>{" "}
            ⚽ gol · P pênalti · F gol de falta · A assistência · C capitão · retângulo
            amarelo/vermelho cartão · ↓ saiu · ↑ entrou · minuto ao lado
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
