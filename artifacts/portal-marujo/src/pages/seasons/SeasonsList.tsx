import { Link } from "wouter";
import { useListSeasons } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function SeasonsList() {
  const { data: seasons, isLoading } = useListSeasons();

  const totals = seasons?.reduce(
    (acc, s) => ({
      matches: acc.matches + s.matches,
      wins: acc.wins + s.wins,
      draws: acc.draws + s.draws,
      losses: acc.losses + s.losses,
      goalsScored: acc.goalsScored + s.goalsScored,
      goalsConceded: acc.goalsConceded + s.goalsConceded,
    }),
    { matches: 0, wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-temporadas">Temporadas</h1>
        <p className="text-sm text-muted-foreground">Desempenho histórico do CSA ano a ano</p>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Temporada</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Saldo</TableHead>
              <TableHead className="py-2 text-right">Aproveit.</TableHead>
              <TableHead className="py-2 text-right hidden sm:table-cell">Artilheiro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : seasons?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">Sem temporadas.</TableCell>
                  </TableRow>
                )
              : seasons?.map((s) => {
                  const gd = s.goalsScored - s.goalsConceded;
                  return (
                    <TableRow key={s.year} className="text-sm" data-testid={`row-season-${s.year}`}>
                      <TableCell className="py-2 font-bold">
                        <Link href={`/temporadas/${s.year}`} className="hover:text-primary hover:underline" data-testid={`link-season-${s.year}`}>
                          {s.year}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right">{s.matches}</TableCell>
                      <TableCell className="py-2 text-right text-green-600 font-medium">{s.wins}</TableCell>
                      <TableCell className="py-2 text-right text-amber-600">{s.draws}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">{s.losses}</TableCell>
                      <TableCell className="py-2 text-right">{s.goalsScored}</TableCell>
                      <TableCell className="py-2 text-right">{s.goalsConceded}</TableCell>
                      <TableCell className={`py-2 text-right font-medium text-xs ${gd >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {gd >= 0 ? "+" : ""}{gd}
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">{pct(s.wins, s.matches)}</TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground text-xs hidden sm:table-cell">
                        {s.topScorer ? `${s.topScorer} (${s.topScorerGoals})` : "–"}
                      </TableCell>
                    </TableRow>
                  );
                })}
            {/* Totals row */}
            {totals && (
              <TableRow className="text-sm font-bold border-t-2 bg-muted/30">
                <TableCell className="py-2">Total</TableCell>
                <TableCell className="py-2 text-right">{totals.matches}</TableCell>
                <TableCell className="py-2 text-right text-green-600">{totals.wins}</TableCell>
                <TableCell className="py-2 text-right text-amber-600">{totals.draws}</TableCell>
                <TableCell className="py-2 text-right text-red-600">{totals.losses}</TableCell>
                <TableCell className="py-2 text-right">{totals.goalsScored}</TableCell>
                <TableCell className="py-2 text-right">{totals.goalsConceded}</TableCell>
                <TableCell className={`py-2 text-right text-xs ${totals.goalsScored - totals.goalsConceded >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totals.goalsScored - totals.goalsConceded >= 0 ? "+" : ""}{totals.goalsScored - totals.goalsConceded}
                </TableCell>
                <TableCell className="py-2 text-right">{pct(totals.wins, totals.matches)}</TableCell>
                <TableCell className="py-2 hidden sm:table-cell" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
