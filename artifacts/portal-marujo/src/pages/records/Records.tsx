import { useGetBiggestVictories, useGetBiggestDefeats } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";
import { assignCompetitionRanks } from "@/lib/competition-rank";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function matchMargin(m: { goalsFor?: number | null; goalsAgainst?: number | null; result?: string }) {
  const gf = m.goalsFor ?? 0;
  const ga = m.goalsAgainst ?? 0;
  return m.result === "loss" ? ga - gf : gf - ga;
}

function MatchTable({
  data,
  isLoading,
  colorClass,
}: {
  data: any[] | undefined;
  isLoading: boolean;
  colorClass: string;
}) {
  const [, setLocation] = useLocation();
  const rows = data ?? [];
  const ranks = assignCompetitionRanks(rows, matchMargin);

  return (
    <div className="border rounded">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="py-2">#</TableHead>
            <TableHead className="py-2">Adversário</TableHead>
            <TableHead className="py-2 text-center">Placar</TableHead>
            <TableHead className="py-2">Data</TableHead>
            <TableHead className="py-2">Competição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-4" /></TableCell>
                </TableRow>
              ))
            : rows.map((m, i) => (
                <TableRow
                  key={m.id}
                  className="text-sm cursor-pointer hover:bg-muted/40"
                  onClick={() => setLocation(`/partidas/${m.id}`)}
                  data-testid={`row-match-${m.id}`}
                >
                  <TableCell className="py-1.5 text-muted-foreground text-xs">{ranks[i]}</TableCell>
                  <TableCell className="py-1.5 font-medium">{m.opponent}</TableCell>
                  <TableCell className={`py-1.5 text-center font-bold ${colorClass}`}>
                    {m.goalsFor}–{m.goalsAgainst}
                  </TableCell>
                  <TableCell className="py-1.5 text-muted-foreground">{fmtDate(m.date)}</TableCell>
                  <TableCell className="py-1.5 text-muted-foreground text-xs">{m.competition}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Records() {
  const { data: victories, isLoading: lV } = useGetBiggestVictories({ limit: 10 });
  const { data: defeats, isLoading: lD } = useGetBiggestDefeats({ limit: 10 });

  return (
    <RecordsLayout title="Recordes Históricos" subtitle="Marcos e estatísticas de desempenho do CSA">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            10 Maiores Vitórias
          </h2>
          <MatchTable data={victories} isLoading={lV} colorClass="text-green-600" />
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            10 Maiores Derrotas
          </h2>
          <MatchTable data={defeats} isLoading={lD} colorClass="text-red-600" />
        </section>
      </div>
    </RecordsLayout>
  );
}
