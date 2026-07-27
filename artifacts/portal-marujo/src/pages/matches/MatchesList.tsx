import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import {
  useListMatches,
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

/** Badge ❓ para resultado desconhecido — mesmo estilo visual do W.O. */
function UnknownResultBadge({ className }: { className?: string }) {
  return (
    <span
      title="Resultado desconhecido"
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        className
      )}
    >
      ❓
    </span>
  );
}

type StatusFilter = "all" | "unknown" | "walkover";

export default function MatchesList() {
  const search = useSearch();
  const initialStatus = (() => {
    const s = new URLSearchParams(search).get("status");
    return (s === "unknown" || s === "walkover") ? (s as StatusFilter) : "all";
  })();

  const [tab, setTab] = useState<"official" | "walkover" | "friendly">("official");
  const [season, setSeason] = useState("all");
  const [result, setResult] = useState("all");
  const [homeAway, setHomeAway] = useState("all");
  const [opponent, setOpponent] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [page, setPage] = useState(1);

  // Sync status from URL on first render (e.g. deep-link from homepage)
  useEffect(() => {
    if (initialStatus !== "all") setStatus(initialStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const limit = 30;

  const { data: seasons } = useListSeasons();

  const baseParams = {
    season: season === "all" ? undefined : season,
    opponent: opponent.length > 1 ? opponent : undefined,
    limit,
    offset: (page - 1) * limit,
  };

  const officialParams = {
    ...baseParams,
    result: result === "all" ? undefined : result,
    home_away: homeAway === "all" ? undefined : homeAway,
  };

  // When status = "walkover" in the official tab we reuse the walkovers hook
  const { data: officialData, isLoading: officialLoading } = useListMatches(officialParams);
  const { data: walkoverData, isLoading: walkoverLoading } = useListWalkovers(baseParams);
  const { data: friendlyData, isLoading: friendlyLoading } = useListFriendlies(baseParams);
  const { data: unknownData, isLoading: unknownLoading } = useListUnknownResults(baseParams);

  // Determine active data source
  let data: typeof officialData;
  let isLoading: boolean;
  if (tab === "friendly") {
    data = friendlyData;
    isLoading = friendlyLoading;
  } else if (tab === "walkover") {
    data = walkoverData;
    isLoading = walkoverLoading;
  } else {
    // official tab — the status filter selects the sub-query
    if (status === "walkover") {
      data = walkoverData;
      isLoading = walkoverLoading;
    } else if (status === "unknown") {
      data = unknownData;
      isLoading = unknownLoading;
    } else {
      data = officialData;
      isLoading = officialLoading;
    }
  }

  function resetFilters() {
    setSeason("all");
    setResult("all");
    setHomeAway("all");
    setOpponent("");
    setStatus("all");
    setPage(1);
  }

  function switchTab(t: "official" | "walkover" | "friendly") {
    setTab(t);
    setStatus("all");
    setPage(1);
  }

  // When the user picks W.O. or ❓ from the status filter we stay in the official tab
  // but swap the data source, so the effective display mode can be "walkover" via filter too.
  const effectiveMode =
    tab === "walkover" || (tab === "official" && status === "walkover")
      ? "walkover"
      : tab === "friendly"
        ? "friendly"
        : tab === "official" && status === "unknown"
          ? "unknown"
          : "official";

  const colSpan = effectiveMode === "official" ? 6 : 5;

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-partidas">Banco de Partidas</h1>
        <p className="text-sm text-muted-foreground">Histórico completo de partidas do CSA</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b -mb-5">
        <TabButton active={tab === "official"} onClick={() => switchTab("official")}>
          Oficiais
        </TabButton>
        <TabButton active={tab === "walkover"} onClick={() => switchTab("walkover")}>
          W.O.
        </TabButton>
        <TabButton active={tab === "friendly"} onClick={() => switchTab("friendly")}>
          Amistosos
        </TabButton>
      </div>

      {/* Banners */}
      {(tab === "walkover" || (tab === "official" && status === "walkover")) && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 mt-0">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>Partidas decididas por W.O. (Walkover). Não houve disputa em campo. Esses jogos são contabilizados nas estatísticas oficiais.</span>
        </div>
      )}
      {tab === "friendly" && (
        <div className="flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 mt-0">
          <span className="mt-0.5 shrink-0">ℹ️</span>
          <span>Partidas amistosas. Esses jogos <strong>não</strong> são contabilizados nas estatísticas oficiais (jogos, vitórias, gols, aproveitamento etc.).</span>
        </div>
      )}
      {tab === "official" && status === "unknown" && (
        <div className="flex items-start gap-2 rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-800/40 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 mt-0">
          <span className="mt-0.5 shrink-0">❓</span>
          <span>Partidas cujo resultado oficial ainda não foi localizado. O placar pode ser atualizado conforme novas fontes forem encontradas.</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center pt-2">
        <Select value={season} onValueChange={(v) => { setSeason(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-28 text-xs" data-testid="select-season">
            <SelectValue placeholder="Temporada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Temporada</SelectItem>
            {seasons?.map((s) => <SelectItem key={s.year} value={s.year}>{s.year}</SelectItem>)}
          </SelectContent>
        </Select>

        {tab === "official" && (
          <>
            {/* Status da Partida filter — only visible in official tab */}
            <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
              <SelectTrigger className="h-8 w-40 text-xs" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status da Partida</SelectItem>
                <SelectItem value="unknown">❓ Resultado desconhecido</SelectItem>
                <SelectItem value="walkover">W.O.</SelectItem>
              </SelectContent>
            </Select>

            {/* Resultado and Mando only make sense for the "normal official" view */}
            {status === "all" && (
              <>
                <Select value={result} onValueChange={(v) => { setResult(v); setPage(1); }}>
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

                <Select value={homeAway} onValueChange={(v) => { setHomeAway(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-28 text-xs" data-testid="select-home-away">
                    <SelectValue placeholder="Mando" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mando</SelectItem>
                    <SelectItem value="home">Mandante</SelectItem>
                    <SelectItem value="away">Visitante</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </>
        )}

        {tab === "friendly" && (
          <>
            <Select value={result} onValueChange={(v) => { setResult(v); setPage(1); }}>
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
            <Select value={homeAway} onValueChange={(v) => { setHomeAway(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-28 text-xs" data-testid="select-home-away">
                <SelectValue placeholder="Mando" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mando</SelectItem>
                <SelectItem value="home">Mandante</SelectItem>
                <SelectItem value="away">Visitante</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        <Input
          placeholder="Adversário..."
          value={opponent}
          onChange={(e) => { setOpponent(e.target.value); setPage(1); }}
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
              {effectiveMode === "official" || effectiveMode === "unknown" ? (
                <>
                  <TableHead className="py-2 text-center">Res.</TableHead>
                  <TableHead className="py-2 text-center">Placar</TableHead>
                </>
              ) : (
                <TableHead className="py-2 text-center">Tipo</TableHead>
              )}
              <TableHead className="py-2">Competição</TableHead>
              <TableHead className="py-2 hidden sm:table-cell">Estádio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={colSpan}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : data?.data.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="h-20 text-center text-muted-foreground">
                      {effectiveMode === "walkover"
                        ? "Nenhum W.O. registrado."
                        : effectiveMode === "friendly"
                          ? "Nenhum amistoso registrado."
                          : effectiveMode === "unknown"
                            ? "Nenhuma partida com resultado desconhecido."
                            : "Nenhuma partida encontrada."}
                    </TableCell>
                  </TableRow>
                )
              : data?.data.map((match) => {
                  const isUnknown = (match as any).isUnknownResult === true || match.result === "unknown";
                  return (
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
                        <span className={cn(
                          "ml-2 text-xs px-1 py-0.5 rounded",
                          match.homeAway === "home"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {match.homeAway === "home" ? "Casa" : "Fora"}
                        </span>
                      </TableCell>

                      {effectiveMode === "official" || effectiveMode === "unknown" ? (
                        <>
                          <TableCell className="py-2 text-center">
                            {isUnknown
                              ? <UnknownResultBadge />
                              : <ResultBadge result={match.result} />}
                          </TableCell>
                          <TableCell className="py-2 text-center font-mono font-bold">
                            {isUnknown ? (
                              <span
                                title="Resultado desconhecido"
                                className="text-gray-400 dark:text-gray-500"
                              >
                                ❓
                              </span>
                            ) : (
                              `${match.goalsFor}–${match.goalsAgainst}`
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="py-2 text-center">
                          <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded">
                            W.O.
                          </span>
                        </TableCell>
                      )}

                      <TableCell className="py-2 text-muted-foreground text-xs">{match.competition}</TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">
                        {match.stadium ?? "–"}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
