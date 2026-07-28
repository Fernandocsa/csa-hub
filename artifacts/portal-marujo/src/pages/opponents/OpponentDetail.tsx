import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  useGetOpponent,
  getGetOpponentQueryKey,
  type OpponentCompetitionStat,
  type OpponentHighlightEntry,
  type OpponentHighlights,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronLeft as PrevIcon, ChevronRight } from "lucide-react";
import { ResultBadge } from "@/components/ui/result-badge";
import { Button } from "@/components/ui/button";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { OpponentCrest, CsaCrest } from "@/components/OpponentCrest";
import { ShareButton } from "@/components/ShareButton";

const PAGE_SIZE = 25;

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function MiniRecord({ label, data: d }: { label: string; data: { matches: number; wins: number; draws: number; losses: number } }) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <span className="font-bold">{d.matches}J</span>
        <span className="text-green-600 font-medium">{d.wins}V</span>
        <span className="text-amber-600">{d.draws}E</span>
        <span className="text-red-600">{d.losses}D</span>
        <span className="text-muted-foreground ml-1">{pct(d.wins, d.matches)}</span>
      </div>
    </div>
  );
}

function CompetitionStatsTable({ rows }: { rows: OpponentCompetitionStat[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma competição registrada neste confronto.</p>
    );
  }

  return (
    <div className="border rounded overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="py-2">Competição</TableHead>
            <TableHead className="py-2 text-right">J</TableHead>
            <TableHead className="py-2 text-right">V</TableHead>
            <TableHead className="py-2 text-right">E</TableHead>
            <TableHead className="py-2 text-right">D</TableHead>
            <TableHead className="py-2 text-right">GP</TableHead>
            <TableHead className="py-2 text-right">GC</TableHead>
            <TableHead className="py-2 text-right">SG</TableHead>
            <TableHead className="py-2 text-right">Aproveit.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.competitionId} className="text-sm">
              <TableCell className="py-2 font-medium">{r.competitionName}</TableCell>
              <TableCell className="py-2 text-right tabular-nums">{r.matches}</TableCell>
              <TableCell className="py-2 text-right tabular-nums text-green-600">{r.wins}</TableCell>
              <TableCell className="py-2 text-right tabular-nums text-amber-600">{r.draws}</TableCell>
              <TableCell className="py-2 text-right tabular-nums text-red-600">{r.losses}</TableCell>
              <TableCell className="py-2 text-right tabular-nums">{r.goalsFor}</TableCell>
              <TableCell className="py-2 text-right tabular-nums">{r.goalsAgainst}</TableCell>
              <TableCell className="py-2 text-right tabular-nums font-medium">
                {r.goalsFor - r.goalsAgainst > 0 ? "+" : ""}
                {r.goalsFor - r.goalsAgainst}
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums">{pct(r.wins, r.matches)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HighlightCard({
  label,
  entry,
  valueSuffix,
  href,
  testId,
}: {
  label: string;
  entry: OpponentHighlightEntry;
  valueSuffix: string;
  href: string;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
      data-testid={testId}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-bold text-base">{entry.name}</p>
      <p className="text-2xl font-black text-primary">
        {entry.value}{" "}
        <span className="text-sm font-normal text-muted-foreground">{valueSuffix}</span>
      </p>
    </Link>
  );
}

function OpponentHighlightsSection({ highlights }: { highlights: OpponentHighlights }) {
  const cards = [
    highlights.topScorer
      ? {
          key: "topScorer",
          label: "Artilheiro",
          entry: highlights.topScorer,
          valueSuffix: highlights.topScorer.value === 1 ? "gol" : "gols",
          href: `/jogadores/${highlights.topScorer.id}`,
          testId: "highlight-top-scorer",
        }
      : null,
    highlights.mostAppearances
      ? {
          key: "mostAppearances",
          label: "Mais Jogos",
          entry: highlights.mostAppearances,
          valueSuffix: highlights.mostAppearances.value === 1 ? "jogo" : "jogos",
          href: `/jogadores/${highlights.mostAppearances.id}`,
          testId: "highlight-most-appearances",
        }
      : null,
    highlights.topAssists
      ? {
          key: "topAssists",
          label: "Mais Assistências",
          entry: highlights.topAssists,
          valueSuffix: highlights.topAssists.value === 1 ? "assist." : "assist.",
          href: `/jogadores/${highlights.topAssists.id}`,
          testId: "highlight-top-assists",
        }
      : null,
    highlights.managerMostMatches
      ? {
          key: "managerMostMatches",
          label: "Técnico com Mais Jogos",
          entry: highlights.managerMostMatches,
          valueSuffix: highlights.managerMostMatches.value === 1 ? "jogo" : "jogos",
          href: `/tecnicos/${highlights.managerMostMatches.id}`,
          testId: "highlight-manager-matches",
        }
      : null,
    highlights.managerMostWins
      ? {
          key: "managerMostWins",
          label: "Técnico com Mais Vitórias",
          entry: highlights.managerMostWins,
          valueSuffix: highlights.managerMostWins.value === 1 ? "vitória" : "vitórias",
          href: `/tecnicos/${highlights.managerMostWins.id}`,
          testId: "highlight-manager-wins",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    entry: OpponentHighlightEntry;
    valueSuffix: string;
    href: string;
    testId: string;
  }>;

  if (cards.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Destaques do Confronto
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <HighlightCard key={card.key} {...card} />
        ))}
      </div>
    </section>
  );
}

export default function OpponentDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id ?? "0", 10);
  const [page, setPage] = useState(0);

  const { data: opponent, isLoading, isError } = useGetOpponent(id, {
    query: { enabled: !!id, queryKey: getGetOpponentQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !opponent) {
    return <div className="text-center p-8 text-destructive">Adversário não encontrado.</div>;
  }

  const allMatches = opponent.allMatches ?? [];
  const competitionStats = opponent.competitionStats ?? [];
  const totalPages = Math.ceil(allMatches.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const pageMatches = allMatches.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/adversarios">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Adversários
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="inline-flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold inline-flex items-center gap-3 flex-wrap" data-testid="heading-opponent">
            <span className="inline-flex items-center gap-2">
              <CsaCrest size="lg" />
              <span>CSA</span>
            </span>
            <span className="text-muted-foreground font-normal">x</span>
            <span className="inline-flex items-center gap-2">
              <span>{opponent.name}</span>
              <OpponentCrest url={opponent.logoUrl} name={opponent.name} size="lg" />
            </span>
          </h1>
          <ShareButton title={`CSA x ${opponent.name}`} />
        </div>
      </div>

      {/* Por competição */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Por Competição
        </h2>
        <CompetitionStatsTable rows={competitionStats} />
      </section>

      {/* Resumo geral */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Resumo Geral
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-border rounded overflow-hidden" data-testid="opponent-stat-bar">
          {[
            { label: "Partidas", value: opponent.matches, highlight: true },
            { label: "Vitórias", value: opponent.wins, color: "text-green-600" },
            { label: "Empates", value: opponent.draws, color: "text-amber-600" },
            { label: "Derrotas", value: opponent.losses, color: "text-red-600" },
            { label: "Gols Pró", value: opponent.goalsFor, highlight: true },
            { label: "Gols Contra", value: opponent.goalsAgainst },
            { label: "Aproveit.", value: pct(opponent.wins, opponent.matches), highlight: true },
          ].map(({ label, value, color, highlight }) => (
            <div key={label} className="bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Home/Away breakdown */}
      {(opponent.homeRecord || opponent.awayRecord) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {opponent.homeRecord && (
            <div className="border rounded p-4 space-y-2">
              <MiniRecord label="Como Mandante" data={opponent.homeRecord} />
            </div>
          )}
          {opponent.awayRecord && (
            <div className="border rounded p-4 space-y-2">
              <MiniRecord label="Como Visitante" data={opponent.awayRecord} />
            </div>
          )}
        </div>
      )}

      {/* Destaques (somente com ficha) */}
      {opponent.highlights ? (
        <OpponentHighlightsSection highlights={opponent.highlights} />
      ) : null}

      {/* Histórico de confrontos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Confrontos
            <span className="ml-2 font-normal text-xs">({allMatches.length} {allMatches.length === 1 ? "jogo" : "jogos"})</span>
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <PrevIcon className="h-3.5 w-3.5" />
              </Button>
              <span>{currentPage + 1}/{totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2">Data</TableHead>
                <TableHead className="py-2">Temporada</TableHead>
                <TableHead className="py-2 text-center">Res.</TableHead>
                <TableHead className="py-2 text-center">Placar</TableHead>
                <TableHead className="py-2">Mando</TableHead>
                <TableHead className="py-2">Competição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">Sem confrontos registrados.</TableCell>
                </TableRow>
              ) : (
                pageMatches.map((match) => (
                  <TableRow
                    key={match.id}
                    className="text-sm cursor-pointer hover:bg-muted/40"
                    onClick={() => setLocation(`/partidas/${match.id}`)}
                    data-testid={`row-match-${match.id}`}
                  >
                    <TableCell className="py-2 text-muted-foreground text-xs">{fmtDate(match.date)}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{match.season}</TableCell>
                    <TableCell className="py-2 text-center">
                      <ResultBadge result={match.result} />
                    </TableCell>
                    <TableCell className="py-2 text-center font-mono font-bold">{match.goalsFor}–{match.goalsAgainst}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{match.homeAway === "home" ? "Casa" : "Fora"}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      <div>{match.competition}</div>
                      {matchPhaseRoundLabel(match.phase, match.round) && (
                        <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                          {matchPhaseRoundLabel(match.phase, match.round)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Exibindo {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, allMatches.length)} de {allMatches.length} jogos
          </p>
        )}
      </div>
    </div>
  );
}
