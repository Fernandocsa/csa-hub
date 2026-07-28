import { Link } from "wouter";
import { useListCompetitions } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BrazilFlag } from "@/components/BrazilFlag";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

const NIVEL: Record<string, string> = {
  state: "Estadual",
  league: "Nacional",
  regional: "Regional",
  cup: "Copa",
  friendly: "Amistoso",
};
function nivel(type?: string | null) {
  return type ? (NIVEL[type] ?? type) : "–";
}

export default function CompetitionsList() {
  const { data: competitions, isLoading } = useListCompetitions();
  const rows = competitions ?? [];
  const ranks = assignCompetitionRanks(rows, (c) => c.matches);
  const { page, setPage, pageSize, total, slice, needsPagination, rankOffset } = useClientPage(rows);

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
              <TableHead className="py-2">Nível</TableHead>
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
              : slice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-20 text-center text-muted-foreground">Nenhuma competição encontrada.</TableCell>
                  </TableRow>
                )
              : slice.map((c, i) => (
                  <TableRow key={c.id} className="text-sm" data-testid={`row-competition-${c.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[rankOffset + i])}</TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/competicoes/${c.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1.5" data-testid={`link-competition-${c.id}`}>
                        <BrazilFlag size="sm" title="Brasil" />
                        {c.name}
                      </Link>
                      {c.titles ? (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded font-medium">
                          {c.titles}x campião
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground text-xs">{nivel(c.type)}</TableCell>
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

      {needsPagination && (
        <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} label=" competições" />
      )}
    </div>
  );
}
