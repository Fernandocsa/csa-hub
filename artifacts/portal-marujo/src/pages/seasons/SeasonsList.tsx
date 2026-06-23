import { useListSeasons } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function SeasonsList() {
  const { data: seasons, isLoading } = useListSeasons();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Temporadas</h1>
        <p className="text-muted-foreground">Desempenho histórico do CSA ano a ano.</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano</TableHead>
              <TableHead className="text-right">J</TableHead>
              <TableHead className="text-right">V</TableHead>
              <TableHead className="text-right">E</TableHead>
              <TableHead className="text-right">D</TableHead>
              <TableHead className="text-right">GP</TableHead>
              <TableHead className="text-right">GC</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : seasons?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">Nenhuma temporada encontrada.</TableCell>
              </TableRow>
            ) : (
              seasons?.map((season) => {
                const totalMatches = season.matches || 1; // avoid div by 0
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
                    <TableCell className="text-right">{season.goalsScored}</TableCell>
                    <TableCell className="text-right">{season.goalsConceded}</TableCell>
                    <TableCell className="text-right font-medium">{winPct}%</TableCell>
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