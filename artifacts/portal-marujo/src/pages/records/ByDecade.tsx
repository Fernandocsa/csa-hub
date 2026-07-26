import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";

interface DecadeRow {
  decade: string;
  decadeLabel: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
}

export default function ByDecade() {
  const { data, isLoading } = useQuery<DecadeRow[]>({
    queryKey: ["records-by-decade"],
    queryFn: () => fetch("/api/records/by-decade").then((r) => r.json()),
  });

  return (
    <RecordsLayout title="Recordes por Década" subtitle="Desempenho histórico do CSA agrupado por década">
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Década</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Saldo</TableHead>
              <TableHead className="py-2 text-right">Aproveita.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : data?.map((row) => (
                  <TableRow key={row.decade} className="text-sm" data-testid={`row-decade-${row.decade}`}>
                    <TableCell className="py-2 font-bold">{row.decadeLabel}</TableCell>
                    <TableCell className="py-2 text-right">{row.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600 font-medium">{row.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{row.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{row.losses}</TableCell>
                    <TableCell className="py-2 text-right">{row.goalsFor}</TableCell>
                    <TableCell className="py-2 text-right">{row.goalsAgainst}</TableCell>
                    <TableCell className={`py-2 text-right font-medium ${row.goalsFor - row.goalsAgainst >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {row.goalsFor - row.goalsAgainst >= 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}
                    </TableCell>
                    <TableCell className="py-2 text-right font-medium">{(row.winPercentage ?? 0).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </RecordsLayout>
  );
}
