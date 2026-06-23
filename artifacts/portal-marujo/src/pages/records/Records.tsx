import { useGetBiggestVictories, useGetBiggestDefeats, useGetStreaks } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
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
            : data?.map((m, i) => (
                <TableRow key={m.id} className="text-sm">
                  <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
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
  const { data: streaks, isLoading: lS } = useGetStreaks();

  const winStreak = streaks?.find((s) => s.type === "winning");
  const unbeatenStreak = streaks?.find((s) => s.type === "unbeaten");
  const losingStreak = streaks?.find((s) => s.type === "losing");

  return (
    <RecordsLayout title="Recordes Históricos" subtitle="Marcos e estatísticas de desempenho do CSA">
      <div className="space-y-8">
        {/* Streaks */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sequências</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lS ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="border rounded p-4"><Skeleton className="h-12" /></div>)
            ) : (
              <>
                {winStreak && (
                  <div className="border rounded p-4 space-y-1" data-testid="streak-winning">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Vitórias</p>
                    <p className="text-3xl font-black text-green-600">{winStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
                    <p className="text-xs text-muted-foreground">{fmtDate(winStreak.startDate)} — {fmtDate(winStreak.endDate)}</p>
                  </div>
                )}
                {unbeatenStreak && (
                  <div className="border rounded p-4 space-y-1" data-testid="streak-unbeaten">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Invencibilidade</p>
                    <p className="text-3xl font-black text-primary">{unbeatenStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
                    <p className="text-xs text-muted-foreground">{fmtDate(unbeatenStreak.startDate)} — {fmtDate(unbeatenStreak.endDate)}</p>
                  </div>
                )}
                {losingStreak && (
                  <div className="border rounded p-4 space-y-1" data-testid="streak-losing">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Derrotas</p>
                    <p className="text-3xl font-black text-red-600">{losingStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
                    <p className="text-xs text-muted-foreground">{fmtDate(losingStreak.startDate)} — {fmtDate(losingStreak.endDate)}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">10 Maiores Vitórias</h2>
            <MatchTable data={victories} isLoading={lV} colorClass="text-green-600" />
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">10 Maiores Derrotas</h2>
            <MatchTable data={defeats} isLoading={lD} colorClass="text-red-600" />
          </section>
        </div>
      </div>
    </RecordsLayout>
  );
}
