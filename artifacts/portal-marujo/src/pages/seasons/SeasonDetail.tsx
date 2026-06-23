import { Link, useParams } from "wouter";
import { useGetSeason, useGetSquadBySeason, getGetSeasonQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function SeasonDetail() {
  const params = useParams();
  const year = params.year ?? "";

  const { data: season, isLoading, isError } = useGetSeason(year, {
    query: { enabled: !!year, queryKey: getGetSeasonQueryKey(year) },
  });
  const { data: squad, isLoading: loadSquad } = useGetSquadBySeason(
    { season: year },
    { query: { enabled: !!year } }
  );

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
    return <div className="text-center p-8 text-destructive">Temporada não encontrada.</div>;
  }

  const gd = season.goalsScored - season.goalsConceded;

  return (
    <div className="space-y-5">
      <Link href="/temporadas">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Temporadas
        </span>
      </Link>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold" data-testid="heading-season">Temporada {season.year}</h1>
        {season.leagueName && season.leaguePosition && (
          <p className="text-sm text-muted-foreground mt-1">
            {season.leagueName} — {season.leaguePosition}º lugar
          </p>
        )}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-border rounded overflow-hidden" data-testid="season-stat-bar">
        {[
          { label: "Partidas", value: season.matches, highlight: true },
          { label: "Vitórias", value: season.wins, color: "text-green-600" },
          { label: "Empates", value: season.draws, color: "text-amber-600" },
          { label: "Derrotas", value: season.losses, color: "text-red-600" },
          { label: "GP", value: season.goalsScored },
          { label: "GC", value: season.goalsConceded },
          { label: "Saldo", value: (gd >= 0 ? "+" : "") + gd, color: gd >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Aproveit.", value: pct(season.wins, season.matches), highlight: true },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
            <p className={`text-lg font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Elenco e Estatísticas</h2>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">#</TableHead>
                  <TableHead className="py-2">Jogador</TableHead>
                  <TableHead className="py-2 text-right">Jogos</TableHead>
                  <TableHead className="py-2 text-right">Gols</TableHead>
                  <TableHead className="py-2 text-right">Assistências</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadSquad
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4" /></TableCell></TableRow>
                    ))
                  : !squad || squad.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">Sem dados do elenco.</TableCell>
                      </TableRow>
                    )
                  : squad.map((player, i) => (
                      <TableRow key={player.id} className="text-sm" data-testid={`row-squad-${player.id}`}>
                        <TableCell className="py-2 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-2 font-medium">
                          <Link href={`/jogadores/${player.id}`} className="hover:text-primary hover:underline">
                            {player.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2 text-right font-medium">{player.appearances}</TableCell>
                        <TableCell className="py-2 text-right text-primary font-bold">{player.goals}</TableCell>
                        <TableCell className="py-2 text-right text-muted-foreground">{player.assists ?? "–"}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Competitions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Competições</h2>
          <div className="space-y-2">
            {season.competitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma competição registrada.</p>
            ) : (
              season.competitions.map((comp, idx) => (
                <div key={idx} className="border rounded px-3 py-2 text-sm font-medium" data-testid={`competition-${idx}`}>
                  {comp}
                </div>
              ))
            )}
          </div>

          {season.leaguePosition && (
            <div className="border rounded p-4 mt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Posição na Liga</p>
              <p className="text-3xl font-black text-primary">{season.leaguePosition}º</p>
              {season.leagueName && <p className="text-xs text-muted-foreground mt-1">{season.leagueName}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
