import { Link } from "wouter";
import { useListStadiums } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function StadiumsList() {
  const { data: stadiums, isLoading } = useListStadiums();
  const rows = stadiums ?? [];
  const ranks = assignCompetitionRanks(rows, (s) => s.matches);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-estadios">Estádios</h1>
        <p className="text-sm text-muted-foreground">Desempenho histórico do CSA em cada praça esportiva</p>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Estádio</TableHead>
              <TableHead className="py-2">Cidade</TableHead>
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
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-4" /></TableCell></TableRow>
                ))
              : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">Nenhum estádio encontrado.</TableCell>
                  </TableRow>
                )
              : rows.map((s, i) => (
                  <TableRow key={s.id} className="text-sm" data-testid={`row-stadium-${s.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[i])}</TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link
                        href={`/estadios/${s.id}`}
                        className="hover:text-primary hover:underline"
                        data-testid={`link-stadium-${s.id}`}
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground text-xs">{s.city ?? "–"}</TableCell>
                    <TableCell className="py-2 text-right">{s.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600 font-medium">{s.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{s.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{s.losses}</TableCell>
                    <TableCell className="py-2 text-right">{s.goalsScored ?? "–"}</TableCell>
                    <TableCell className="py-2 text-right">{s.goalsConceded ?? "–"}</TableCell>
                    <TableCell className="py-2 text-right font-bold">{pct(s.wins, s.matches)}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
