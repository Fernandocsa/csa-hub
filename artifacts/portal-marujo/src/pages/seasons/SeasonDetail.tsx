import { Link, useParams } from "wouter";
import { useGetSeason, getGetSeasonQueryKey } from "@workspace/api-client-react";
import type {
  PlayerStat,
  SeasonCompetitionStat,
  SeasonTopEntry,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { groupPlayersByPosition } from "@/lib/position-groups";

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
                  {i + 1}
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

function CompetitionSummary({ rows }: { rows: SeasonCompetitionStat[] }) {
  const totals = rows.reduce(
    (acc, r) => ({
      games: acc.games + r.games,
      wins: acc.wins + r.wins,
      draws: acc.draws + r.draws,
      losses: acc.losses + r.losses,
      goalsFor: acc.goalsFor + r.goalsFor,
      goalsAgainst: acc.goalsAgainst + r.goalsAgainst,
    }),
    { games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
  );

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
            <TableHead className="py-2 text-right">SG</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.competitionId} className="text-sm">
              <TableCell className="py-2 font-medium">
                <span>{r.competitionName}</span>
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
              <TableCell className="py-2 text-right tabular-nums font-medium">
                {gdLabel(r.goalsFor, r.goalsAgainst)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="text-sm border-t-2">
            <TableCell className="py-2 font-semibold">Total</TableCell>
            <TableCell className="py-2 text-right tabular-nums font-semibold">
              {totals.games}
            </TableCell>
            <TableCell className="py-2 text-right tabular-nums font-semibold">
              {totals.wins}
            </TableCell>
            <TableCell className="py-2 text-right tabular-nums font-semibold">
              {totals.draws}
            </TableCell>
            <TableCell className="py-2 text-right tabular-nums font-semibold">
              {totals.losses}
            </TableCell>
            <TableCell className="py-2 text-right tabular-nums font-semibold">
              {gdLabel(totals.goalsFor, totals.goalsAgainst)}
            </TableCell>
          </TableRow>
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
    <div className="space-y-5">
      {groups.map(({ group, players: list }) => (
        <section key={group}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {group}
          </h3>
          <div className="border rounded overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Jogador</TableHead>
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right">G</TableHead>
                  <TableHead className="py-2 text-right">A</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((player) => (
                  <TableRow key={player.id} className="text-sm" data-testid={`row-squad-${player.id}`}>
                    <TableCell className="py-2">
                      <Link
                        href={`/jogadores/${player.id}`}
                        className="hover:text-primary hover:underline block"
                      >
                        <span className="font-medium">{player.name}</span>
                        {player.seasonAge != null ? (
                          <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                            {player.seasonAge} anos
                          </span>
                        ) : null}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right font-medium tabular-nums align-top">
                      {player.appearances}
                    </TableCell>
                    <TableCell className="py-2 text-right text-primary font-bold tabular-nums align-top">
                      {player.goals}
                    </TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground tabular-nums align-top">
                      {player.assists ?? "–"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
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
        <h1 className="text-2xl font-bold" data-testid="heading-season">
          Temporada {season.year}
        </h1>
      </div>

      {/* Totals from dual competition rows */}
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
                className="px-3 py-2.5 flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <Link
                  href={`/tecnicos/${m.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {m.name}
                </Link>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {m.games}J · {m.wins}V · {m.draws}E · {m.losses}D
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Competition summary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo da Temporada
        </h2>
        <CompetitionSummary rows={competitionStats} />
      </section>

      {/* Roster by position */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Elenco
        </h2>
        <RosterByPosition players={season.players} />
      </section>

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
    </div>
  );
}
