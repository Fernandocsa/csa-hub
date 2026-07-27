import { Link, useParams } from "wouter";
import { useGetPlayersByBirthStateDetail } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { ufDisplayName } from "@/lib/br-locations";

function formatPeriod(first: string | null, last: string | null): string {
  if (!first) return "–";
  if (!last || first === last) return first;
  return `${first}–${last}`;
}

export default function PlayersByStateDetail() {
  const params = useParams<{ uf: string }>();
  const uf = params.uf ?? "";
  const isUnknown = uf.toLowerCase() === "sem-estado";
  const { data, isLoading, isError } = useGetPlayersByBirthStateDetail(uf);

  const title = isUnknown
    ? "Sem estado de nascimento"
    : data?.state
      ? `Nascidos em ${ufDisplayName(data.state)}`
      : `Nascidos em ${uf.toUpperCase()}`;

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 max-w-4xl">
        <Link href="/jogadores/por-estado">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Por Estado
          </span>
        </Link>
        <p className="text-destructive">Estado não encontrado ou inválido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/jogadores/por-estado">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back-por-estado"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Por Estado
        </span>
      </Link>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold" data-testid="heading-birth-state-detail">
          {title}
        </h1>
        {!isUnknown && data.state && (
          <p className="text-sm text-muted-foreground mt-1">{data.state}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px bg-border rounded overflow-hidden">
        <div className="bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogadores</p>
          <p className="text-xl font-bold text-primary mt-0.5">{data.playerCount}</p>
        </div>
        <div className="bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogos</p>
          <p className="text-xl font-bold mt-0.5">{data.totalAppearances}</p>
        </div>
        <div className="bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols</p>
          <p className="text-xl font-bold mt-0.5">{data.totalGoals}</p>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2 w-10">#</TableHead>
              <TableHead className="py-2">Jogador</TableHead>
              <TableHead className="py-2">Cidade</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Jogos</TableHead>
              <TableHead className="py-2 text-right">Gols</TableHead>
              <TableHead className="py-2">Período no CSA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  Nenhum jogador neste filtro.
                </TableCell>
              </TableRow>
            ) : (
              data.players.map((player, i) => (
                <TableRow
                  key={player.id}
                  className="text-sm"
                  data-testid={`row-birth-state-${player.id}`}
                >
                  <TableCell className="py-2 text-muted-foreground text-xs">
                    {i + 1}
                  </TableCell>
                  <TableCell className="py-2 font-medium">
                    <Link
                      href={`/jogadores/${player.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {player.name}
                    </Link>
                    {player.position && (
                      <span className="block text-xs text-muted-foreground">
                        {player.position}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-muted-foreground">
                    {player.birthCity || "–"}
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold text-primary">
                    {player.appearances}
                  </TableCell>
                  <TableCell className="py-2 text-right">{player.goals}</TableCell>
                  <TableCell className="py-2 text-muted-foreground">
                    {formatPeriod(player.firstSeason, player.lastSeason)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
