import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useListMatches, useListSeasons } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { cn } from "@/lib/utils";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { useSeasonQueryParam } from "@/hooks/useSeasonQueryParam";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function MatchesList() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { season, setSeason } = useSeasonQueryParam("/partidas");

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
  const limit = 30;

  const { data: seasons } = useListSeasons();

  const { data, isLoading } = useListMatches({
    season: season === "all" ? undefined : season,
    opponent: opponent.length > 1 ? opponent : undefined,
    result: result === "all" ? undefined : result,
    home_away: homeAway === "all" ? undefined : homeAway,
    limit,
    offset: (page - 1) * limit,
  });

  function resetFilters() {
    setSeason("all");
    setResult("all");
    setHomeAway("all");
    setOpponent("");
    setPage(1);
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
                    <TableCell className="py-2 text-center">
                      <ResultBadge result={match.result} />
                    </TableCell>
                    <TableCell className="py-2 text-center font-mono font-bold">
                      {match.goalsFor}–{match.goalsAgainst}
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

      {data && data.total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} de {data.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              data-testid="button-prev"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= data.total}
              onClick={() => setPage((p) => p + 1)}
              data-testid="button-next"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
