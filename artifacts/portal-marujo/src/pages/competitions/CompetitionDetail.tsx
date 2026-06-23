import { useGetCompetition } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy } from "lucide-react";

export default function CompetitionDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: comp, isLoading, isError } = useGetCompetition(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !comp) {
    return <div className="text-center p-8 text-destructive">Erro ao carregar competição.</div>;
  }

  const winPct = ((comp.wins / (comp.matches || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/competicoes">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Competições
        </Button>
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-foreground">{comp.name}</h1>
        {comp.titles ? (
          <div className="flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full font-bold text-lg">
            <Trophy className="w-5 h-5 text-accent" />
            {comp.titles} {comp.titles === 1 ? 'Título' : 'Títulos'}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium opacity-80 uppercase">Aproveitamento</p>
            <p className="text-4xl font-black mt-2">{winPct}%</p>
            <p className="text-xs opacity-80 mt-1">{comp.matches} Jogos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Vitórias</p>
            <p className="text-4xl font-black text-green-600 mt-2">{comp.wins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Empates</p>
            <p className="text-4xl font-black text-gray-500 mt-2">{comp.draws}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Derrotas</p>
            <p className="text-4xl font-black text-destructive mt-2">{comp.losses}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Edição</TableHead>
                <TableHead className="text-right">J</TableHead>
                <TableHead className="text-right">V</TableHead>
                <TableHead className="text-right">E</TableHead>
                <TableHead className="text-right">D</TableHead>
                <TableHead className="text-right">GP</TableHead>
                <TableHead className="text-right">GC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comp.seasonStats?.map((season) => (
                <TableRow key={season.year}>
                  <TableCell className="font-bold">
                    <Link href={`/temporadas/${season.year}`} className="text-primary hover:underline">
                      {season.year}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{season.matches}</TableCell>
                  <TableCell className="text-right text-green-600">{season.wins}</TableCell>
                  <TableCell className="text-right text-gray-500">{season.draws}</TableCell>
                  <TableCell className="text-right text-destructive">{season.losses}</TableCell>
                  <TableCell className="text-right">{season.goalsScored}</TableCell>
                  <TableCell className="text-right">{season.goalsConceded}</TableCell>
                </TableRow>
              ))}
              {(!comp.seasonStats || comp.seasonStats.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">Nenhum dado por temporada encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}