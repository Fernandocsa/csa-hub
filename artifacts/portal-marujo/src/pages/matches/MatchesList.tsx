import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useListMatches, useListSeasons } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";
import { cn } from "@/lib/utils";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { useSeasonQueryParam } from "@/hooks/useSeasonQueryParam";
import { ListPagination } from "@/components/ListPagination";
import { LIST_PAGE_SIZE } from "@/lib/list-page";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function MatchesList() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { season } = useSeasonQueryParam("/partidas");

  const searchParams = new URLSearchParams(search);
  const competitionIdParam = searchParams.get("competitionId");
  const competitionId =
    competitionIdParam && /^\d+$/.test(competitionIdParam)
      ? competitionIdParam
      : undefined;

  useEffect(() => {
    setPage(1);
  }, [competitionId, season]);

  // Legacy deep-links from Home / bookmarks
  useEffect(() => {
    const status = new URLSearchParams(search).get("status");
    if (status === "unknown") setLocation("/partidas/sem-resultado");
    else if (status === "walkover") setLocation("/partidas/wo");
  }, [search, setLocation]);

  const [result, setResult] = useState("all");
  const [homeAway, setHomeAway] = useState("all");
  const [opponent, setOpponent] = useState("");
  const [page, setPage] = useState(1);
  const limit = LIST_PAGE_SIZE;

  const { data: seasons } = useListSeasons();

  const { data, isLoading } = useListMatches({
    season: season === "all" ? undefined : season,
    competitionId,
    opponent: opponent.length > 1 ? opponent : undefined,
    result: result === "all" ? undefined : result,
    home_away: homeAway === "all" ? undefined : homeAway,
    limit,
    offset: (page - 1) * limit,
  });

  function buildPartidasUrl(next: {
    season?: string;
    competitionId?: string | null;
  }) {
    const params = new URLSearchParams();
    const nextSeason = next.season ?? season;
    if (nextSeason && nextSeason !== "all") params.set("season", nextSeason);
    const nextComp =
      next.competitionId === undefined ? competitionId : next.competitionId;
    if (nextComp) params.set("competitionId", nextComp);
    const qs = params.toString();
    return qs ? `/partidas?${qs}` : "/partidas";
  }

  function resetFilters() {
    setResult("all");
    setHomeAway("all");
    setOpponent("");
    setPage(1);
    setLocation("/partidas");
  }

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-partidas">
          Histórico de Partidas
        </h1>
        <p className="text-sm text-muted-foreground">
          Partidas oficiais do CSA (sem amistosos, W.O. ou resultado desconhecido)
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={season}
          onValueChange={(v) => {
            setPage(1);
            setLocation(
              buildPartidasUrl({
                season: v,
                competitionId: competitionId ?? null,
              }),
            );
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

        <Select
          value={result}
          onValueChange={(v) => {
            setResult(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-28 text-xs" data-testid="select-result">
            <SelectValue placeholder="Resultado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Resultado</SelectItem>
            <SelectItem value="win">Vitória</SelectItem>
            <SelectItem value="draw">Empate</SelectItem>
            <SelectItem value="loss">Derrota</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={homeAway}
          onValueChange={(v) => {
            setHomeAway(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-28 text-xs" data-testid="select-home-away">
            <SelectValue placeholder="Mando" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mando</SelectItem>
            <SelectItem value="home">Mandante</SelectItem>
            <SelectItem value="away">Visitante</SelectItem>
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
          data-testid="input-opponent"
        />

        {competitionId && (
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setLocation(buildPartidasUrl({ competitionId: null }));
            }}
            className="h-8 inline-flex items-center gap-1 rounded border px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Remover filtro de competição"
          >
            {data?.data?.[0]?.competition
              ? data.data[0].competition
              : `Competição #${competitionId}`}
            <span aria-hidden>×</span>
          </button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 text-xs text-muted-foreground"
          data-testid="button-reset"
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
              <TableHead className="py-2 text-center">Res.</TableHead>
              <TableHead className="py-2 text-center">Placar</TableHead>
              <TableHead className="py-2">Competição</TableHead>
              <TableHead className="py-2 hidden sm:table-cell">Estádio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
              : data?.data.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      Nenhuma partida encontrada.
                    </TableCell>
                  </TableRow>
                )
              : data?.data.map((match) => (
                  <TableRow key={match.id} className="text-sm" data-testid={`row-match-${match.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {fmtDate(match.date)}
                    </TableCell>
                    <TableCell className="py-2">
                      <OpponentHistoryLink
                        opponentId={(match as { opponentId?: number }).opponentId}
                        name={match.opponent}
                        logoUrl={(match as { opponentLogoUrl?: string | null }).opponentLogoUrl}
                      />
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
                    <TableCell className="py-2 text-center">
                      <ResultBadge result={match.result} />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <MatchScoreLink matchId={match.id}>
                        {match.goalsFor}–{match.goalsAgainst}
                      </MatchScoreLink>
                    </TableCell>
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
                ))}
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
