import { Link } from "wouter";
import { useListManagers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function ManagersList() {
  const { data: managers, isLoading } = useListManagers();
  const rows = managers ?? [];
  const ranks = assignCompetitionRanks(rows, (m) => m.matches);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-tecnicos">Técnicos</h1>
        <p className="text-sm text-muted-foreground">Histórico de treinadores que comandaram o CSA</p>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Treinador</TableHead>
              <TableHead className="py-2 text-right">Período</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Aproveit.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-4" /></TableCell></TableRow>
                ))
              : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">Nenhum técnico encontrado.</TableCell>
                  </TableRow>
                )
              : rows.map((m, i) => (
                  <TableRow key={m.id} className="text-sm" data-testid={`row-manager-${m.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[i])}</TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/tecnicos/${m.id}`} className="hover:text-primary hover:underline" data-testid={`link-manager-${m.id}`}>
                        {m.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {m.startYear != null
                        ? m.endYear != null && m.endYear !== m.startYear
                          ? `${m.startYear}–${m.endYear}`
                          : String(m.startYear)
                        : "–"}
                    </TableCell>
                    <TableCell className="py-2 text-right">{m.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600 font-medium">{m.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{m.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{m.losses}</TableCell>
                    <TableCell className="py-2 text-right">
                      {(m as { goalsFor?: number; goalsScored?: number }).goalsFor ??
                        (m as { goalsScored?: number }).goalsScored ??
                        "–"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {(m as { goalsAgainst?: number; goalsConceded?: number }).goalsAgainst ??
                        (m as { goalsConceded?: number }).goalsConceded ??
                        "–"}
                    </TableCell>
                    <TableCell className="py-2 text-right font-bold text-primary">{(m.winPercentage ?? 0).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
