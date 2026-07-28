import { Link } from "wouter";
import { useGetForeignPlayers, useGetNationalities } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";
import { PlayerFlag } from "@/components/PlayerFlag";

function formatPeriod(first: string | null, last: string | null): string {
  if (!first) return "–";
  if (!last || first === last) return first;
  return `${first}–${last}`;
}

export default function Estrangeiros() {
  const { data: players, isLoading } = useGetForeignPlayers();
  const { data: nationalities } = useGetNationalities();

  const totalPlayers = players?.length ?? 0;
  const totalCountries = nationalities?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-estrangeiros">Estrangeiros</h1>
        <p className="text-sm text-muted-foreground">Jogadores de outros países que vestiram a camisa do CSA</p>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded overflow-hidden">
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de estrangeiros</p>
            <p className="text-2xl font-bold text-primary mt-0.5">{totalPlayers}</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Países representados</p>
            <p className="text-2xl font-bold text-primary mt-0.5">{totalCountries}</p>
          </div>
        </div>
      )}

      {/* Countries summary */}
      {nationalities && nationalities.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Por País</h2>
          <div className="flex flex-wrap gap-2">
            {nationalities.map((n) => (
              <Link
                key={n.nationality}
                href={`/jogadores/estrangeiros/${encodeURIComponent(n.nationality ?? "")}`}
              >
                <span className="inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                  <PlayerFlag
                    flag={n.nationalityFlag}
                    nationality={n.nationality}
                    showBrazil={false}
                  />
                  <span className="font-medium">{n.nationality}</span>
                  <span className="text-muted-foreground">({n.playerCount})</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Players table */}
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2 w-10">#</TableHead>
              <TableHead className="py-2">Jogador</TableHead>
              <TableHead className="py-2">Nacionalidade</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Jogos</TableHead>
              <TableHead className="py-2 text-right">Gols</TableHead>
              <TableHead className="py-2">Período no CSA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : players?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      <Globe className="h-6 w-6 mx-auto mb-1 opacity-40" />
                      Nenhum jogador estrangeiro encontrado.
                    </TableCell>
                  </TableRow>
                )
              : players?.map((player, i) => (
                  <TableRow key={player.id} className="text-sm" data-testid={`row-foreign-${player.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link
                        href={`/jogadores/${player.id}`}
                        className="hover:text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <PlayerFlag
                          flag={player.nationalityFlag}
                          nationality={player.nationality}
                          showBrazil={false}
                        />
                        {player.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2">
                      <Link
                        href={`/jogadores/estrangeiros/${encodeURIComponent(player.nationality ?? "")}`}
                        className="hover:text-primary hover:underline text-muted-foreground text-xs"
                      >
                        {player.nationality}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right font-bold text-primary">{player.appearances}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{player.goals}</TableCell>
                    <TableCell className="py-2 text-muted-foreground text-xs">
                      {formatPeriod(player.firstSeason, player.lastSeason)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
