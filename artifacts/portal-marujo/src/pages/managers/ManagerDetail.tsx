import { useGetManager } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ManagerDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: manager, isLoading, isError } = useGetManager(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !manager) {
    return <div className="text-center p-8 text-destructive">Erro ao carregar técnico.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/tecnicos">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Técnicos
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-foreground">{manager.name}</h1>
        {manager.nationality && <p className="text-muted-foreground mt-1">{manager.nationality}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium opacity-80 uppercase">Aproveitamento</p>
            <p className="text-4xl font-black mt-2">{manager.winPercentage.toFixed(1)}%</p>
            <p className="text-xs opacity-80 mt-1">{manager.matches} Jogos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Vitórias</p>
            <p className="text-4xl font-black text-green-600 mt-2">{manager.wins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Empates</p>
            <p className="text-4xl font-black text-gray-500 mt-2">{manager.draws}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Derrotas</p>
            <p className="text-4xl font-black text-destructive mt-2">{manager.losses}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico por Temporada</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead className="text-right">J</TableHead>
                <TableHead className="text-right">V</TableHead>
                <TableHead className="text-right">E</TableHead>
                <TableHead className="text-right">D</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manager.seasonStats?.map((season) => {
                const totalMatches = season.matches || 1;
                const winPct = ((season.wins / totalMatches) * 100).toFixed(1);
                return (
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
                    <TableCell className="text-right font-medium">{winPct}%</TableCell>
                  </TableRow>
                );
              })}
              {(!manager.seasonStats || manager.seasonStats.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Sem dados detalhados por temporada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}