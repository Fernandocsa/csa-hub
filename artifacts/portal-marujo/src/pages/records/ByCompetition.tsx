import { useListCompetitions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";

export default function ByCompetition() {
  const { data: competitions, isLoading } = useListCompetitions();

  return (
    <RecordsLayout title="Recordes por Competição" subtitle="Desempenho histórico do CSA em cada competição">
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Competição</TableHead>
              <TableHead className="py-2">Tipo</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Aproveita.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : competitions?.map((c) => {
                  const pct = c.matches > 0 ? ((c.wins / c.matches) * 100).toFixed(1) + "%" : "–";
                  return (
                    <TableRow key={c.id} className="text-sm" data-testid={`row-competition-${c.id}`}>
                      <TableCell className="py-2 font-medium">
                        <Link href={`/competicoes/${c.id}`} className="hover:text-primary hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs">{c.type ?? "–"}</TableCell>
                      <TableCell className="py-2 text-right">{c.matches}</TableCell>
                      <TableCell className="py-2 text-right text-green-600 font-medium">{c.wins}</TableCell>
                      <TableCell className="py-2 text-right text-amber-600">{c.draws}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">{c.losses}</TableCell>
                      <TableCell className="py-2 text-right">{c.goalsScored}</TableCell>
                      <TableCell className="py-2 text-right">{c.goalsConceded}</TableCell>
                      <TableCell className="py-2 text-right font-medium">{pct}</TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </RecordsLayout>
  );
}
