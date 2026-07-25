import { Link, useParams } from "wouter";
import { useGetPlayer, getGetPlayerQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export default function PlayerDetail() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);

  const { data: player, isLoading, isError } = useGetPlayer(id, {
    query: { enabled: !!id, queryKey: getGetPlayerQueryKey(id) },
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

  if (isError || !player) {
    return <div className="text-center p-8 text-destructive">Jogador não encontrado.</div>;
  }

  const avgGoals = player.totalAppearances > 0
    ? (player.totalGoals / player.totalAppearances).toFixed(2)
    : "–";

  const flag = (player as any).nationalityFlag as string | null | undefined;
  const isForeign = player.nationality && player.nationality !== "Brasil";

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/jogadores">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Jogadores
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="flex items-baseline gap-2">
          {isForeign && flag && (
            <span className="text-3xl leading-none">{flag}</span>
          )}
          <h1 className="text-2xl font-bold" data-testid="heading-player-name">{player.name}</h1>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
          {player.position && <span className="border rounded px-2 py-0.5 text-xs font-medium">{player.position}</span>}
          {player.nationality && (
            <span className="flex items-center gap-1">
              {isForeign && flag && <span className="text-base">{flag}</span>}
              <Link
                href={isForeign ? `/jogadores/estrangeiros/${encodeURIComponent(player.nationality)}` : "#"}
                className={isForeign ? "hover:text-primary hover:underline" : "pointer-events-none"}
              >
                {player.nationality}
              </Link>
            </span>
          )}
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 gap-px bg-border rounded overflow-hidden" data-testid="player-stat-bar">
        {[
          { label: "Partidas", value: player.totalAppearances, highlight: true },
          { label: "Gols", value: player.totalGoals },
          { label: "Assistências", value: player.totalAssists ?? "–" },
          { label: "Gols/Jogo", value: avgGoals },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-background p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${highlight ? "text-primary" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Season stats table */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estatísticas por Temporada</h2>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2">Temporada</TableHead>
                <TableHead className="py-2 text-right">Jogos</TableHead>
                <TableHead className="py-2 text-right">Gols</TableHead>
                <TableHead className="py-2 text-right">Assistências</TableHead>
                <TableHead className="py-2 text-right">Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {player.seasonStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">Sem estatísticas por temporada.</TableCell>
                </TableRow>
              ) : (
                player.seasonStats.map((stat, idx) => (
                  <TableRow key={`${stat.season}-${idx}`} className="text-sm" data-testid={`row-season-${stat.season}`}>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/temporadas/${stat.season}`} className="hover:text-primary hover:underline">
                        {stat.season}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right">{stat.appearances}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{stat.goals}</TableCell>
                    <TableCell className="py-2 text-right">{stat.assists ?? "–"}</TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {stat.appearances > 0 ? (stat.goals / stat.appearances).toFixed(2) : "–"}
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
