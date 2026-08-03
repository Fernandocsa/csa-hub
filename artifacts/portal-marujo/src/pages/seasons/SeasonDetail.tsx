import { Link, useParams } from "wouter";
import {
  useGetSeason,
  getGetSeasonQueryKey,
  useListMatches,
} from "@workspace/api-client-react";
import type {
  PlayerStat,
  SeasonCompetitionStat,
  SeasonTopEntry,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { EntityPhoto } from "@/components/EntityPhoto";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";
import { groupPlayersByPosition } from "@/lib/position-groups";
import { cn, formatDateBr } from "@/lib/utils";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function fmtDate(d: string) {
  return formatDateBr(d);
}

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function gdLabel(gf: number, ga: number) {
  const d = gf - ga;
  return (d > 0 ? "+" : "") + d;
}

function TopBlock({
  title,
  entries,
  listHref,
  valueLabel,
}: {
  title: string;
  entries: SeasonTopEntry[] | undefined;
  listHref: string;
  valueLabel: string;
}) {
  const ranks = assignCompetitionRanks(entries ?? [], (e) => e.value);
  return (
    <div className="border rounded overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {valueLabel}
        </span>
      </div>
      <ul className="divide-y">
        {!entries || entries.length === 0 ? (
          <li className="px-3 py-4 text-sm text-muted-foreground text-center">Sem dados</li>
        ) : (
          entries.map((e, i) => (
            <li key={e.id} className="px-3 py-2 flex items-baseline justify-between gap-3 text-sm">
              <div className="min-w-0 flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">
                  {formatCompetitionRank(ranks[i])}
                </span>
                <Link
                  href={`/jogadores/${e.id}`}
                  className="font-medium hover:text-primary hover:underline truncate"
                >
                  {e.name}
                </Link>
              </div>
              <span className="font-bold tabular-nums text-primary shrink-0">{e.value}</span>
            </li>
          ))
        )}
      </ul>
      <div className="px-3 py-2 border-t">
        <Link
          href={listHref}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver lista completa
        </Link>
      </div>
    </div>
  );
}

function CompetitionSummary({
  rows,
  year,
}: {
  rows: SeasonCompetitionStat[];
  year: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma competição no resumo desta temporada.</p>
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
              <TableCell className="py-2 font-medium">
                <Link
                  href={`/partidas?season=${encodeURIComponent(year)}&competitionId=${r.competitionId}`}
                  className="hover:text-primary hover:underline"
                >
                  {r.competitionName}
                </Link>
                {r.classification ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {r.classification}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums">{r.games}</TableCell>
              <TableCell className="py-2 text-right tabular-nums text-green-600">
                {r.wins}
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums text-amber-600">
                {r.draws}
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums text-red-600">
                {r.losses}
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums">{r.goalsFor}</TableCell>
              <TableCell className="py-2 text-right tabular-nums">{r.goalsAgainst}</TableCell>
              <TableCell className="py-2 text-right tabular-nums font-medium">
                {gdLabel(r.goalsFor, r.goalsAgainst)}
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums">
                {pct(r.wins, r.games)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RosterByPosition({ players }: { players: PlayerStat[] }) {
  const groups = groupPlayersByPosition(players);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados do elenco.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map(({ group, players: list }) => (
        <section key={group}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {group}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {list.map((player) => (
              <li key={player.id} data-testid={`row-squad-${player.id}`}>
                <Link
                  href={`/jogadores/${player.id}`}
                  className="flex items-center gap-3 rounded-md px-1 py-1 -mx-1 hover:bg-muted/50 group"
                >
                  <PlayerPhoto url={player.photoUrl} name={player.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm truncate block group-hover:text-primary">
                      {player.name}
                    </span>
                    {player.seasonAge != null ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{player.seasonAge} anos</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 w-8 text-right text-sm tabular-nums font-semibold text-muted-foreground">
                    {player.shirtNumber != null ? player.shirtNumber : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SeasonRecentMatches({ year }: { year: string }) {
  const { data, isLoading } = useListMatches({
    season: year,
    limit: 5,
    offset: 0,
  });

  const matches = data?.data ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Jogos
        </h2>
        <Link
          href={`/partidas?season=${year}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Data</TableHead>
              <TableHead className="py-2">Adversário</TableHead>
              <TableHead className="py-2 text-center">Res.</TableHead>
              <TableHead className="py-2 text-center">Placar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-4" />
                  </TableCell>
                </TableRow>
              ))
            ) : matches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                  Nenhuma partida nesta temporada.
                </TableCell>
              </TableRow>
            ) : (
              matches.map((match) => {
                const isUnknown =
                  (match as { isUnknownResult?: boolean }).isUnknownResult === true ||
                  match.result === "unknown";
                return (
                  <TableRow key={match.id} className="text-sm" data-testid={`row-season-match-${match.id}`}>
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
                      {isUnknown ? (
                        <span className="text-xs text-muted-foreground">❓</span>
                      ) : (
                        <ResultBadge result={match.result} />
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      {isUnknown ? (
                        <span className="text-muted-foreground font-mono font-bold">❓</span>
                      ) : (
                        <MatchScoreLink matchId={match.id}>
                          {match.goalsFor}–{match.goalsAgainst}
                        </MatchScoreLink>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default function SeasonDetail() {
  const params = useParams();
  const year = params.year ?? "";

  const { data: season, isLoading, isError } = useGetSeason(year, {
    query: { enabled: !!year, queryKey: getGetSeasonQueryKey(year) },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !season) {
    return (
      <div className="text-center p-8 text-destructive">Temporada não encontrada.</div>
    );
  }

  const gd = season.goalsScored - season.goalsConceded;
  const managers = season.managers ?? [];
  const competitionStats = season.competitionStats ?? [];

  return (
    <div className="space-y-8">
      <Link href="/temporadas">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Temporadas
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="inline-flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-0.5">
            <Link
              href={`/temporadas/${Number(season.year) - 1}`}
              aria-label={`Temporada ${Number(season.year) - 1}`}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1
              className="text-2xl font-bold tabular-nums"
              data-testid="heading-season"
            >
              Temporada {season.year}
            </h1>
            <Link
              href={`/temporadas/${Number(season.year) + 1}`}
              aria-label={`Temporada ${Number(season.year) + 1}`}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <ShareButton title={`Temporada ${season.year}`} />
        </div>
      </div>

      {/* Competition summary first — cards below act as the season total */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo da Temporada
        </h2>
        <CompetitionSummary rows={competitionStats} year={season.year} />
      </section>

      <div
        className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-border rounded overflow-hidden"
        data-testid="season-stat-bar"
      >
        {[
          { label: "Partidas", value: season.matches, highlight: true },
          { label: "Vitórias", value: season.wins, color: "text-green-600" },
          { label: "Empates", value: season.draws, color: "text-amber-600" },
          { label: "Derrotas", value: season.losses, color: "text-red-600" },
          { label: "GP", value: season.goalsScored },
          { label: "GC", value: season.goalsConceded },
          {
            label: "Saldo",
            value: (gd >= 0 ? "+" : "") + gd,
            color: gd >= 0 ? "text-green-600" : "text-red-600",
          },
          {
            label: "Aproveit.",
            value: pct(season.wins, season.matches),
            highlight: true,
          },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">
              {label}
            </p>
            <p
              className={`text-lg font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent matches */}
      <SeasonRecentMatches year={season.year} />

      {/* Roster by position */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Elenco
        </h2>
        <RosterByPosition players={season.players} />
      </section>

      {/* Managers */}
      {managers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {managers.length === 1 ? "Treinador" : "Treinadores"}
          </h2>
          <div className="border rounded divide-y">
            {managers.map((m) => (
              <div
                key={m.id}
                className="px-3 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={`/tecnicos/${m.id}`}
                  className="hover:text-primary hover:underline flex items-center gap-3 min-w-0"
                >
                  <EntityPhoto
                    url={m.photoUrl}
                    name={m.name}
                    size="md"
                    shape="circle"
                    label="Foto do técnico"
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{m.name}</span>
                    {m.seasonAge != null ? (
                      <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                        {m.seasonAge} anos
                      </span>
                    ) : null}
                  </span>
                </Link>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {m.games}J · {m.wins}V · {m.draws}E · {m.losses}D
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top 5 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Destaques
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TopBlock
            title="Mais jogos"
            valueLabel="J"
            entries={season.topAppearances}
            listHref={`/jogadores/presencas?season=${season.year}`}
          />
          <TopBlock
            title="Mais gols"
            valueLabel="G"
            entries={season.topGoals}
            listHref={`/jogadores/artilheiros?season=${season.year}`}
          />
          <TopBlock
            title="Mais assistências"
            valueLabel="A"
            entries={season.topAssists}
            listHref={`/jogadores/assistencias?season=${season.year}`}
          />
        </div>
      </section>

      <EntitySuggestionForm
        entityType="season"
        entityId={Number(season.year)}
      />
    </div>
  );
}
