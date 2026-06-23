import { useGetPlayer } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Calendar } from "lucide-react";

export default function PlayerDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: player, isLoading, isError } = useGetPlayer(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !player) {
    return <div className="text-center p-8 text-destructive">Erro ao carregar jogador.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/jogadores">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Jogadores
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">{player.name}</h1>
          <p className="text-lg text-muted-foreground mt-1 flex items-center gap-2">
            <User className="h-4 w-4" /> {player.position || "Sem Posição"}
            {player.nationality && <span className="text-sm bg-muted px-2 py-0.5 rounded ml-2">{player.nationality}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6">
            <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Jogos</p>
            <p className="text-4xl font-black mt-2">{player.totalAppearances}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gols</p>
            <p className="text-4xl font-black text-foreground mt-2">{player.totalGoals}</p>
          </CardContent>
        </Card>
        {player.totalAssists !== null && player.totalAssists !== undefined && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assistências</p>
              <p className="text-4xl font-black text-foreground mt-2">{player.totalAssists}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estatísticas por Temporada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Temporada</TableHead>
                <TableHead className="text-right">Jogos</TableHead>
                <TableHead className="text-right">Gols</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {player.seasonStats.map((stat, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    <Link href={`/temporadas/${stat.season}`} className="hover:underline text-primary">
                      {stat.season}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{stat.appearances}</TableCell>
                  <TableCell className="text-right">{stat.goals}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}