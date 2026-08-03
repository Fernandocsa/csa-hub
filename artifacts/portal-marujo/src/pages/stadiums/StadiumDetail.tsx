import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetStadiumDetail } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronLeft as PrevIcon, ChevronRight } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { EntityPhoto } from "@/components/EntityPhoto";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";
import { ResultBadge } from "@/components/ui/result-badge";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { LIST_PAGE_SIZE } from "@/lib/list-page";
import { formatDateBr } from "@/lib/utils";

const PAGE_SIZE = LIST_PAGE_SIZE;

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return formatDateBr(d);
}

export default function StadiumDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data: stadium, isLoading, isError } = useGetStadiumDetail(id);
  const [matchPage, setMatchPage] = useState(0);
  const [oppPage, setOppPage] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !stadium) {
    return (
      <div className="space-y-3 max-w-3xl">
        <Link href="/estadios">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Estádios
          </span>
        </Link>
        <p className="text-destructive">Estádio não encontrado.</p>
      </div>
    );
  }

  const allMatches = stadium.allMatches ?? [];
  const opponentsFaced = stadium.opponentsFaced ?? [];
  const matchPages = Math.max(1, Math.ceil(allMatches.length / PAGE_SIZE));
  const currentMatchPage = Math.min(matchPage, matchPages - 1);
  const pageMatches = allMatches.slice(
    currentMatchPage * PAGE_SIZE,
    (currentMatchPage + 1) * PAGE_SIZE,
  );
  const oppPages = Math.max(1, Math.ceil(opponentsFaced.length / PAGE_SIZE));
  const currentOppPage = Math.min(oppPage, oppPages - 1);
  const pageOpponents = opponentsFaced.slice(
    currentOppPage * PAGE_SIZE,
    (currentOppPage + 1) * PAGE_SIZE,
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/estadios">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Estádios
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="flex items-start gap-3">
          <EntityPhoto
            url={stadium.photoUrl}
            name={stadium.name}
            size="lg"
            shape="rounded"
            className="mt-0.5"
            label="Foto do estádio"
          />
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl font-bold" data-testid="heading-stadium">
                {stadium.name}
              </h1>
              <ShareButton title={stadium.name} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {[
                stadium.city,
                stadium.state,
                stadium.capacity != null
                  ? `Capacidade ${stadium.capacity.toLocaleString("pt-BR")}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Desempenho histórico do CSA neste estádio"}
            </p>
          </div>
        </div>
        {stadium.homeClubs && stadium.homeClubs.length > 0 && (
          <p className="text-sm mt-2">
            <span className="text-muted-foreground">Sede de: </span>
            {stadium.homeClubs.map((club, i) => (
              <span key={club.id}>
                {i > 0 ? ", " : ""}
                <Link
                  href={`/adversarios/${club.id}`}
                  className="text-primary hover:underline"
                >
                  {club.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <div
        className="grid grid-cols-5 gap-px bg-border rounded overflow-hidden"
        data-testid="stadium-stat-bar"
      >
        {[
          { label: "Partidas", value: stadium.matches, highlight: true },
          { label: "Vitórias", value: stadium.wins, color: "text-green-600" },
          { label: "Empates", value: stadium.draws, color: "text-amber-600" },
          { label: "Derrotas", value: stadium.losses, color: "text-red-600" },
          {
            label: "Aproveit.",
            value: pct(stadium.wins, stadium.matches),
            highlight: true,
          },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p
              className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols pró</p>
          <p className="text-lg font-bold mt-0.5">{stadium.goalsScored}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols contra</p>
          <p className="text-lg font-bold mt-0.5">{stadium.goalsConceded}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">1ª partida</p>
          <p className="text-lg font-bold mt-0.5">
            {stadium.firstMatch ? fmtDate(stadium.firstMatch) : "–"}
          </p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Última partida</p>
          <p className="text-lg font-bold mt-0.5">
            {stadium.lastMatch ? fmtDate(stadium.lastMatch) : "–"}
          </p>
        </div>
      </div>

      <div data-testid="stadium-opponents">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Adversários enfrentados
            <span className="ml-2 font-normal text-xs">
              ({opponentsFaced.length})
            </span>
          </h2>
          {oppPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setOppPage((p) => Math.max(0, p - 1))}
                disabled={currentOppPage === 0}
              >
                <PrevIcon className="h-3.5 w-3.5" />
              </Button>
              <span>
                {currentOppPage + 1}/{oppPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setOppPage((p) => Math.min(oppPages - 1, p + 1))}
                disabled={currentOppPage >= oppPages - 1}
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
                <TableHead className="py-2">Adversário</TableHead>
                <TableHead className="py-2 text-right">J</TableHead>
                <TableHead className="py-2 text-right text-green-600">V</TableHead>
                <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                <TableHead className="py-2 text-right text-red-600">D</TableHead>
                <TableHead className="py-2 text-right">Aproveit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageOpponents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-16 text-center text-muted-foreground"
                  >
                    Nenhum adversário registrado neste estádio.
                  </TableCell>
                </TableRow>
              ) : (
                pageOpponents.map((opp) => (
                  <TableRow key={opp.id} className="text-sm">
                    <TableCell className="py-2 font-medium">
                      <OpponentHistoryLink
                        opponentId={opp.id}
                        name={opp.name}
                        logoUrl={opp.logoUrl}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right">{opp.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{opp.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{opp.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{opp.losses}</TableCell>
                    <TableCell className="py-2 text-right font-medium">
                      {pct(opp.wins, opp.matches)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div data-testid="stadium-matches">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Partidas
            <span className="ml-2 font-normal text-xs">
              ({allMatches.length} {allMatches.length === 1 ? "jogo" : "jogos"})
            </span>
          </h2>
          {matchPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setMatchPage((p) => Math.max(0, p - 1))}
                disabled={currentMatchPage === 0}
              >
                <PrevIcon className="h-3.5 w-3.5" />
              </Button>
              <span>
                {currentMatchPage + 1}/{matchPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() =>
                  setMatchPage((p) => Math.min(matchPages - 1, p + 1))
                }
                disabled={currentMatchPage >= matchPages - 1}
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
                <TableHead className="py-2">Adversário</TableHead>
                <TableHead className="py-2 text-center">Res.</TableHead>
                <TableHead className="py-2 text-center">Placar</TableHead>
                <TableHead className="py-2">Mando</TableHead>
                <TableHead className="py-2">Competição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageMatches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-16 text-center text-muted-foreground"
                  >
                    Nenhuma partida vinculada.
                  </TableCell>
                </TableRow>
              ) : (
                pageMatches.map((match) => (
                  <TableRow key={match.id} className="text-sm">
                    <TableCell className="py-2 text-muted-foreground text-xs">
                      {fmtDate(match.date)}
                    </TableCell>
                    <TableCell className="py-2 font-medium">
                      <OpponentHistoryLink
                        opponentId={match.opponentId}
                        name={match.opponent}
                        logoUrl={match.opponentLogoUrl}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <ResultBadge result={match.result} />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <MatchScoreLink matchId={match.id}>
                        {match.goalsFor}–{match.goalsAgainst}
                      </MatchScoreLink>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {match.homeAway === "home" ? "Casa" : "Fora"}
                    </TableCell>
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
        {matchPages > 1 && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Exibindo {currentMatchPage * PAGE_SIZE + 1}–
            {Math.min((currentMatchPage + 1) * PAGE_SIZE, allMatches.length)} de{" "}
            {allMatches.length} jogos
          </p>
        )}
      </div>

      <EntitySuggestionForm entityType="stadium" entityId={stadium.id} />
    </div>
  );
}
