import { Link } from "wouter";
import { useListCompetitions } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function CompetitionsList() {
  const { data: competitions, isLoading } = useListCompetitions();

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-competicoes">Competições</h1>
        <p className="text-sm text-muted-foreground">Histórico em todos os torneios disputados pelo CSA</p>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Competição</TableHead>
              <TableHead className="py-2">Tipo</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Aproveit.</TableHead>
              <TableHead className="py-2 text-right">Última Ed.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={11}><Skeleton className="h-4" /></TableCell></TableRow>
                ))
              : competitions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-20 text-center text-muted-foreground">Nenhuma competição encontrada.</TableCell>
                  </TableRow>
                )
              : competitions?.map((c, i) => (
                  <TableRow key={c.id} className="text-sm" data-testid={`row-competition-${c.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/competicoes/${c.id}`} className="hover:text-primary hover:underline" data-testid={`link-competition-${c.id}`}>
                        {c.name}
                      </Link>
                      {c.titles ? (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded font-medium">
                          {c.titles}x campião
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground text-xs">{c.type ?? "–"}</TableCell>
                    <TableCell className="py-2 text-right">{c.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600 font-medium">{c.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{c.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{c.losses}</TableCell>
                    <TableCell className="py-2 text-right">{c.goalsScored}</TableCell>
                    <TableCell className="py-2 text-right">{c.goalsConceded}</TableCell>
                    <TableCell className="py-2 text-right font-bold">{pct(c.wins, c.matches)}</TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">{c.lastParticipation ?? "–"}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
