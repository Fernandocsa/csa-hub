import { useGetHomeAwayRecords } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function HomeAway() {
  const { data: records, isLoading } = useGetHomeAwayRecords({});

  const rows = records
    ? [
        { label: "Mandante", data: records.home },
        { label: "Visitante", data: records.away },
        { label: "Neutro", data: records.neutral },
      ]
    : [];

  return (
    <RecordsLayout title="Mando de Campo" subtitle="Desempenho do CSA como mandante, visitante e em campo neutro">
      {isLoading ? (
        <div className="border rounded"><Skeleton className="h-40 w-full" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {rows.map(({ label, data: d }) => (
              <div key={label} className="border rounded p-4 space-y-3" data-testid={`card-${label.toLowerCase()}`}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
                <p className="text-3xl font-black text-primary">{pct(d.wins, d.matches)}</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Partidas</span>
                    <span className="font-medium">{d.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Vitórias</span>
                    <span className="font-medium text-green-600">{d.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Empates</span>
                    <span className="font-medium text-amber-600">{d.draws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Derrotas</span>
                    <span className="font-medium text-red-600">{d.losses}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Mando</TableHead>
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
                {rows.map(({ label, data: d }) => (
                  <TableRow key={label} className="text-sm">
                    <TableCell className="py-2 font-medium">{label}</TableCell>
                    <TableCell className="py-2 text-right">{d.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{d.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{d.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{d.losses}</TableCell>
                    <TableCell className="py-2 text-right">{d.goalsFor}</TableCell>
                    <TableCell className="py-2 text-right">{d.goalsAgainst}</TableCell>
                    <TableCell className={`py-2 text-right font-medium ${d.goalsFor - d.goalsAgainst >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {d.goalsFor - d.goalsAgainst >= 0 ? "+" : ""}{d.goalsFor - d.goalsAgainst}
                    </TableCell>
                    <TableCell className="py-2 text-right font-medium">{pct(d.wins, d.matches)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </RecordsLayout>
  );
}
