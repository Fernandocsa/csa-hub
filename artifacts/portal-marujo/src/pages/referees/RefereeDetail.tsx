import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetReferee } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronLeft as PrevIcon, ChevronRight } from "lucide-react";
import { ResultBadge } from "@/components/ui/result-badge";
import { Button } from "@/components/ui/button";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { ufDisplayName } from "@/lib/br-locations";
import { ShareButton } from "@/components/ShareButton";
import { EntityPhoto } from "@/components/EntityPhoto";

import { LIST_PAGE_SIZE } from "@/lib/list-page";

const PAGE_SIZE = LIST_PAGE_SIZE;

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function MiniRecord({
  label,
  data: d,
}: {
  label: string;
  data: { matches: number; wins: number; draws: number; losses: number };
}) {
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

export default function RefereeDetail() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const [page, setPage] = useState(0);

  const { data: referee, isLoading, isError } = useGetReferee(id);

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !referee) {
    return <div className="text-center p-8 text-destructive">Árbitro não encontrado.</div>;
  }

  const allMatches = referee.allMatches ?? [];
  const totalPages = Math.ceil(allMatches.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const pageMatches = allMatches.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/arbitros">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Árbitros
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="flex items-start gap-3">
          <EntityPhoto
            url={referee.photoUrl}
            name={referee.name}
            size="lg"
            className="mt-0.5"
            label="Foto do árbitro"
          />
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl font-bold" data-testid="heading-referee">
                {referee.name}
              </h1>
              <ShareButton title={referee.name} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {referee.state
                ? `${referee.state} · ${ufDisplayName(referee.state)}`
                : "Federação não informada"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-px bg-border rounded overflow-hidden">
        {[
          { label: "Partidas", value: referee.matches, highlight: true },
          { label: "Vitórias", value: referee.wins, color: "text-green-600" },
          { label: "Empates", value: referee.draws, color: "text-amber-600" },
          { label: "Derrotas", value: referee.losses, color: "text-red-600" },
          {
            label: "Aproveit.",
            value: pct(referee.wins, referee.matches),
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border rounded p-4">
          <MiniRecord label="Casa" data={referee.homeRecord} />
        </div>
        <div className="border rounded p-4">
          <MiniRecord label="Fora" data={referee.awayRecord} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Partidas
            <span className="ml-2 font-normal text-xs">
              ({allMatches.length} {allMatches.length === 1 ? "jogo" : "jogos"})
            </span>
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
              <span>
                {currentPage + 1}/{totalPages}
              </span>
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
                      <Link
                        href={`/partidas/${match.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {fmtDate(match.date)}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 font-medium">{match.opponent}</TableCell>
                    <TableCell className="py-2 text-center">
                      <ResultBadge result={match.result} />
                    </TableCell>
                    <TableCell className="py-2 text-center font-mono font-bold">
                      {match.goalsFor}–{match.goalsAgainst}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {match.homeAway === "home"
                        ? "Casa"
                        : match.homeAway === "away"
                          ? "Fora"
                          : "Neutro"}
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
      </div>
    </div>
  );
}
