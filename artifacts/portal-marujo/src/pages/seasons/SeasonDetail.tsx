import { useGetSeason, useGetSquadBySeason } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function SeasonDetail() {
  const params = useParams();
  const year = params.year || "";

  const { data: season, isLoading, isError } = useGetSeason(year, {
    query: { enabled: !!year }
  });

  const { data: squad, isLoading: isLoadingSquad } = useGetSquadBySeason(
    { season: year },
    { query: { enabled: !!year } }
  );

  if (isLoading || isLoadingSquad) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !season) {
    return <div className="text-center p-8 text-destructive">Erro ao carregar temporada.</div>;
  }

  const winPct = ((season.wins / (season.matches || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link href="/temporadas">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Temporadas
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-foreground">Temporada {season.year}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium opacity-80 uppercase">Aproveitamento</p>
            <p className="text-4xl font-black mt-2">{winPct}%</p>
            <p className="text-xs mt-1 opacity-80">{season.matches} Jogos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Vitórias</p>
            <p className="text-4xl font-black text-green-600 mt-2">{season.wins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Empates</p>
            <p className="text-4xl font-black text-gray-500 mt-2">{season.draws}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Derrotas</p>
            <p className="text-4xl font-black text-destructive mt-2">{season.losses}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Elenco e Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead className="text-right">Jogos</TableHead>
                  <TableHead className="text-right">Gols</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {squad?.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      <Link href={`/jogadores/${player.id}`} className="hover:underline text-primary">
                        {player.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{player.appearances}</TableCell>
                    <TableCell className="text-right">{player.goals}</TableCell>
                  </TableRow>
                ))}
                {(!squad || squad.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">Sem dados do elenco.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competições Disputadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {season.competitions.map((comp, idx) => (
                <div key={idx} className="p-3 border rounded-md font-medium">
                  {comp}
                </div>
              ))}
              {season.competitions.length === 0 && (
                <p className="text-muted-foreground">Nenhuma competição registrada.</p>
              )}
            </div>
            
            {season.leaguePosition !== null && season.leaguePosition !== undefined && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2">Posição na Liga ({season.leagueName})</h3>
                <div className="p-4 bg-muted rounded-md inline-flex items-center gap-4">
                  <span className="text-3xl font-bold">{season.leaguePosition}º</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}