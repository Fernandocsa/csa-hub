import { useLocation } from "wouter";
import type { ReactNode, KeyboardEvent } from "react";
import type { PlayerSheetMatch } from "@workspace/api-client-react";
import { ResultBadge } from "@/components/ui/result-badge";
import { BrazilFlag } from "@/components/BrazilFlag";
import {
  competitionAbbreviation,
  matchRoundCompact,
} from "@/lib/competition-abbr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString(
    "pt-BR",
  );
}

function fmtMinute(minute: number, injury?: number | null) {
  if (injury != null && injury > 0) return `${minute}+${injury}'`;
  return `${minute}'`;
}

function VenueMark({ homeAway }: { homeAway: string }) {
  if (homeAway === "home") {
    return <span className="text-muted-foreground font-normal">(C)</span>;
  }
  if (homeAway === "away") {
    return <span className="text-muted-foreground font-normal">(F)</span>;
  }
  return <span className="text-muted-foreground font-normal">(N)</span>;
}

function MinutesCell({ m }: { m: PlayerSheetMatch }) {
  const parts: ReactNode[] = [];

  if (m.minuteIn != null) {
    parts.push(
      <span
        key="in"
        className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
        title="Entrou"
      >
        <span aria-hidden>▲</span>
        {fmtMinute(m.minuteIn, m.minuteInInjury)}
      </span>,
    );
  }

  if (m.minuteOut != null) {
    parts.push(
      <span
        key="out"
        className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400"
        title="Saiu"
      >
        <span aria-hidden>▼</span>
        {fmtMinute(m.minuteOut, m.minuteOutInjury)}
      </span>,
    );
  }

  if (parts.length === 0) {
    if (m.role === "starter") {
      return <span className="tabular-nums text-muted-foreground">90'</span>;
    }
    return <span className="text-muted-foreground">–</span>;
  }

  return <span className="inline-flex flex-wrap items-center gap-1.5">{parts}</span>;
}

function CardIcon({ color }: { color: "yellow" | "red" }) {
  return (
    <span
      aria-hidden
      className={
        color === "yellow"
          ? "inline-block w-2.5 h-3.5 rounded-[1px] bg-amber-400 border border-amber-600/40"
          : "inline-block w-2.5 h-3.5 rounded-[1px] bg-red-600 border border-red-800/40"
      }
    />
  );
}

export function PlayerMatchHistoryTable({
  matches,
}: {
  matches: PlayerSheetMatch[];
}) {
  const [, setLocation] = useLocation();

  if (matches.length === 0) return null;

  return (
    <div className="border rounded overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <TableHead className="py-2 w-8" />
            <TableHead className="py-2 whitespace-nowrap">Data</TableHead>
            <TableHead className="py-2" title="Competição">
              Comp.
            </TableHead>
            <TableHead className="py-2 text-center" title="Rodada / fase">
              Rd
            </TableHead>
            <TableHead className="py-2 min-w-[12rem]">Partida</TableHead>
            <TableHead className="py-2 text-center">Placar</TableHead>
            <TableHead className="py-2 text-center" title="Gols do jogador">
              G
            </TableHead>
            <TableHead className="py-2 text-center whitespace-nowrap">Min</TableHead>
            <TableHead className="py-2 text-center w-7" title="Cartão amarelo">
              A
            </TableHead>
            <TableHead className="py-2 text-center w-7" title="Cartão vermelho">
              V
            </TableHead>
            <TableHead className="py-2 text-center w-7" title="Gol">
              ⚽
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((m) => {
            const abbr = competitionAbbreviation(m.competition);
            const rd = matchRoundCompact(m.phase, m.round);
            const isUnknown = m.result === "unknown";
            const href = `/partidas/${m.matchId}`;

            const go = () => setLocation(href);
            const onKey = (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go();
              }
            };

            return (
              <TableRow
                key={m.matchId}
                role="link"
                tabIndex={0}
                onClick={go}
                onKeyDown={onKey}
                className="text-sm hover:bg-muted/50 cursor-pointer"
                data-testid={`row-player-match-${m.matchId}`}
                aria-label={`Partida CSA × ${m.opponent}`}
              >
                <TableCell className="py-2 px-2">
                  {!isUnknown ? (
                    <ResultBadge result={m.result} />
                  ) : (
                    <span className="inline-block w-6 h-6" />
                  )}
                </TableCell>
                <TableCell className="py-2 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                  {fmtDate(m.date)}
                </TableCell>
                <TableCell className="py-2">
                  <span
                    className="inline-flex items-center gap-1"
                    title={m.competition ?? undefined}
                  >
                    <BrazilFlag size="sm" title={m.competition ?? "Brasil"} />
                    <span className="text-xs font-semibold tracking-wide">
                      {abbr}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="py-2 text-center text-xs text-muted-foreground whitespace-nowrap">
                  {rd}
                </TableCell>
                <TableCell className="py-2 font-medium">
                  CSA <VenueMark homeAway={m.homeAway} />
                  <span className="text-muted-foreground font-normal mx-1">×</span>
                  {m.opponent}
                </TableCell>
                <TableCell className="py-2 text-center font-mono tabular-nums text-xs whitespace-nowrap">
                  {isUnknown
                    ? "?-?"
                    : `${m.goalsFor ?? "–"}-${m.goalsAgainst ?? "–"}`}
                </TableCell>
                <TableCell className="py-2 text-center tabular-nums font-medium">
                  {m.playerGoals > 0 ? m.playerGoals : ""}
                </TableCell>
                <TableCell className="py-2 text-center text-xs whitespace-nowrap">
                  <MinutesCell m={m} />
                </TableCell>
                <TableCell className="py-2 text-center">
                  {m.yellowCards > 0 ? (
                    <span className="inline-flex items-center justify-center gap-0.5">
                      <CardIcon color="yellow" />
                      {m.yellowCards > 1 && (
                        <span className="text-[10px] text-muted-foreground">
                          ×{m.yellowCards}
                        </span>
                      )}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="py-2 text-center">
                  {m.redCards > 0 ? <CardIcon color="red" /> : null}
                </TableCell>
                <TableCell className="py-2 text-center">
                  {m.playerGoals > 0 ? (
                    <span aria-label={`${m.playerGoals} gol(s)`}>⚽</span>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
