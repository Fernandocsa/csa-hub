import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  useListSeasons,
  useListWalkovers,
  useListFriendlies,
  useListUnknownResults,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { cn } from "@/lib/utils";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { useSeasonQueryParam } from "@/hooks/useSeasonQueryParam";
import { ListPagination } from "@/components/ListPagination";
import { LIST_PAGE_SIZE } from "@/lib/list-page";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function UnknownResultBadge({ className }: { className?: string }) {
  return (
    <span
      title="Resultado desconhecido"
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        className,
      )}
    >
      ❓
    </span>
  );
}

export type MatchSpecialKind = "friendly" | "walkover" | "unknown";

const META: Record<
  MatchSpecialKind,
  {
    title: string;
    subtitle: string;
    basePath: string;
    /** Optional intro under the title — muted, not an alert. */
    intro?: ReactNode;
    empty: string;
    showScore: boolean;
  }
> = {
  friendly: {
    title: "Amistosos",
    subtitle: "Partidas amistosas do CSA",
    basePath: "/partidas/amistosos",
    intro: (
      <>
        Esses jogos <strong>não</strong> são contabilizados nas estatísticas oficiais (jogos,
        vitórias, gols, aproveitamento etc.).
      </>
    ),
    empty: "Nenhum amistoso registrado.",
    showScore: true,
  },
  walkover: {
    title: "W.O.",
    subtitle: "Partidas decididas por Walkover",
    basePath: "/partidas/wo",
    intro:
      "Não houve disputa em campo. Contam nas estatísticas oficiais como vitória ou derrota por 1–0 (sem gol atribuído a artilheiros).",
    empty: "Nenhum W.O. registrado.",
    showScore: false,
  },
  unknown: {
    title: "Sem Resultado",
    subtitle: "Partidas com resultado oficial ainda não localizado",
    basePath: "/partidas/sem-resultado",
    intro:
      "O placar pode ser atualizado conforme novas fontes forem encontradas.",
    empty: "Nenhuma partida com resultado desconhecido.",
    showScore: true,
  },
};

export default function MatchesSpecialList({ kind }: { kind: MatchSpecialKind }) {
  const meta = META[kind];
  const { season, setSeason } = useSeasonQueryParam(meta.basePath);
  const [opponent, setOpponent] = useState("");
  const [page, setPage] = useState(1);
  const limit = LIST_PAGE_SIZE;

  const { data: seasons } = useListSeasons();
  const baseParams = {
    season: season === "all" ? undefined : season,
    opponent: opponent.length > 1 ? opponent : undefined,
    limit,
    offset: (page - 1) * limit,
  };

  const walkovers = useListWalkovers(baseParams);
  const friendlies = useListFriendlies(baseParams);
  const unknowns = useListUnknownResults(baseParams);

  const active =
    kind === "walkover" ? walkovers : kind === "friendly" ? friendlies : unknowns;
  const data = active.data;
  const isLoading = active.isLoading;
  const colSpan = meta.showScore ? 6 : 6;

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid={`heading-${kind}`}>
          {meta.title}
        </h1>
        <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
        {meta.intro ? (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">{meta.intro}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={season}
          onValueChange={(v) => {
            setSeason(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-28 text-xs" data-testid="select-season">
            <SelectValue placeholder="Temporada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Temporada</SelectItem>
            {seasons?.map((s) => (
              <SelectItem key={s.year} value={s.year}>
                {s.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Adversário..."
          value={opponent}
          onChange={(e) => {
            setOpponent(e.target.value);
            setPage(1);
          }}
          className="h-8 w-36 text-xs"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSeason("all");
            setOpponent("");
            setPage(1);
          }}
          className="h-8 text-xs text-muted-foreground"
        >
          Limpar
        </Button>

        {data && (
          <span className="text-xs text-muted-foreground ml-auto">{data.total} partidas</span>
        )}
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Data</TableHead>
              <TableHead className="py-2">Adversário</TableHead>
              {meta.showScore ? (
                <>
                  <TableHead className="py-2 text-center">Res.</TableHead>
                  <TableHead className="py-2 text-center">Placar</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="py-2 text-center">Tipo</TableHead>
                  <TableHead className="py-2 text-center">Res.</TableHead>
                </>
              )}
              <TableHead className="py-2">Competição</TableHead>
              <TableHead className="py-2 hidden sm:table-cell">Estádio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={colSpan}>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
              : data?.data.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="h-20 text-center text-muted-foreground">
                      {meta.empty}
                    </TableCell>
                  </TableRow>
                )
              : data?.data.map((match) => {
                  const isUnknown =
                    (match as { isUnknownResult?: boolean }).isUnknownResult === true ||
                    match.result === "unknown";
                  return (
                    <TableRow key={match.id} className="text-sm">
                      <TableCell className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(match.date)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Link
                          href={`/partidas/${match.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {match.opponent}
                        </Link>
                        <span
                          className={cn(
                            "ml-2 text-xs px-1 py-0.5 rounded",
                            match.homeAway === "home"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {match.homeAway === "home" ? "Casa" : "Fora"}
                        </span>
                      </TableCell>
                      {meta.showScore ? (
                        <>
                          <TableCell className="py-2 text-center">
                            {isUnknown ? (
                              <UnknownResultBadge />
                            ) : (
                              <ResultBadge result={match.result} />
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center font-mono font-bold">
                            {isUnknown ? (
                              <span className="text-gray-400 dark:text-gray-500">❓</span>
                            ) : (
                              `${match.goalsFor}–${match.goalsAgainst}`
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="py-2 text-center">
                            <span className="text-xs font-semibold text-muted-foreground border px-2 py-0.5 rounded">
                              W.O.
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {match.result === "win" || match.result === "loss" ? (
                              <ResultBadge result={match.result} />
                            ) : (
                              <span className="text-xs text-muted-foreground">–</span>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="py-2 text-muted-foreground text-xs">
                        <div>{match.competition}</div>
                        {matchPhaseRoundLabel(
                          (match as { phase?: string | null }).phase,
                          (match as { round?: string | null }).round,
                        ) && (
                          <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {matchPhaseRoundLabel(
                              (match as { phase?: string | null }).phase,
                              (match as { round?: string | null }).round,
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">
                        {match.stadium ?? "–"}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {data && (
        <ListPagination
          page={page}
          pageSize={limit}
          total={data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
