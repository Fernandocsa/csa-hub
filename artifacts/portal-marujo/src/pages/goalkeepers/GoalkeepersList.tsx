import { useListGoalkeepers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function GoalkeepersList() {
  const { data: goalkeepers, isLoading } = useListGoalkeepers({});

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Goleiros</h1>
        <p className="text-muted-foreground">Estatísticas dos paredões que defenderam a meta azulina.</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Partidas</TableHead>
              <TableHead className="text-right">Gols Sofridos</TableHead>
              <TableHead className="text-right">Média (gols/jogo)</TableHead>
              <TableHead className="text-right">Clean Sheets (Jogos sem sofrer gol)</TableHead>
              <TableHead className="text-right">% Clean Sheets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : goalkeepers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Nenhum goleiro encontrado.</TableCell>
              </TableRow>
            ) : (
              goalkeepers?.map((gk) => {
                const avg = (gk.goalsConceeded / (gk.matches || 1)).toFixed(2);
                const csPct = gk.cleanSheetPercentage?.toFixed(1) || ((gk.cleanSheets / (gk.matches || 1)) * 100).toFixed(1);
                return (
                  <TableRow key={gk.id}>
                    <TableCell className="font-bold">
                      <Link href={`/jogadores/${gk.id}`} className="text-primary hover:underline">
                        {gk.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">{gk.matches}</TableCell>
                    <TableCell className="text-right text-destructive">{gk.goalsConceeded}</TableCell>
                    <TableCell className="text-right">{avg}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{gk.cleanSheets}</TableCell>
                    <TableCell className="text-right">{csPct}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}