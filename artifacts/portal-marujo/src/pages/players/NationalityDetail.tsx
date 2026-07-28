import { Link, useParams } from "wouter";
import { useGetPlayersByNationality, useGetNationalities } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { PlayerFlag } from "@/components/PlayerFlag";

function formatPeriod(first: string | null, last: string | null): string {
  if (!first) return "–";
  if (!last || first === last) return first;
  return `${first}–${last}`;
}

export default function NationalityDetail() {
  const params = useParams();
  const country = decodeURIComponent(params.country ?? "");

  const { data: players, isLoading, isError } = useGetPlayersByNationality(country);
  const { data: nationalities } = useGetNationalities();

  const summary = nationalities?.find((n) => n.nationality === country);
  const flag = players?.[0]?.nationalityFlag ?? summary?.nationalityFlag;

  if (isError) {
    return (
      <div className="space-y-4">
        <Link href="/jogadores/estrangeiros">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Estrangeiros
          </span>
        </Link>
        <div className="text-center p-8 text-destructive">País não encontrado.</div>
      </div>
    );
  }

  const totalAppearances = players?.reduce((s, p) => s + p.appearances, 0) ?? 0;
  const totalGoals = players?.reduce((s, p) => s + p.goals, 0) ?? 0;

  return (
    <div className="space-y-5">
      <Link href="/jogadores/estrangeiros">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Estrangeiros
        </span>
      </Link>

      <div className="border-b pb-4">
        {isLoading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <PlayerFlag
                flag={flag}
                nationality={country}
                size="lg"
                showBrazil={false}
              />
              <div>
                <h1 className="text-2xl font-bold" data-testid="heading-nationality">{country}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {players?.length ?? 0} {(players?.length ?? 0) === 1 ? "jogador" : "jogadores"} pelo CSA
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stat bar */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-px bg-border rounded overflow-hidden">
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogadores</p>
            <p className="text-2xl font-bold text-primary mt-0.5">{players?.length ?? 0}</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de jogos</p>
            <p className="text-2xl font-bold mt-0.5">{totalAppearances}</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de gols</p>
            <p className="text-2xl font-bold mt-0.5">{totalGoals}</p>
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
              <TableHead className="py-2">Posição</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Jogos</TableHead>
              <TableHead className="py-2 text-right">Gols</TableHead>
              <TableHead className="py-2">Período no CSA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : players?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                      Nenhum jogador encontrado.
                    </TableCell>
                  </TableRow>
                )
              : players?.map((player, i) => (
                  <TableRow key={player.id} className="text-sm" data-testid={`row-player-${player.id}`}>
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
                    <TableCell className="py-2 text-muted-foreground text-xs">{player.position ?? "–"}</TableCell>
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
