import { Link } from "wouter";
import { useGetBiggestVictories, useGetBiggestDefeats, useGetStreaks } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

/** Vitória: gols marcados, depois saldo | Derrota: gols sofridos, depois saldo. */
function matchRankKey(m: {
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  result?: string;
}) {
  const gf = m.goalsFor ?? 0;
  const ga = m.goalsAgainst ?? 0;
  return m.result === "loss" ? `${ga}:${ga - gf}` : `${gf}:${gf - ga}`;
}

function MatchTable({ data, isLoading, colorClass }: { data: any[] | undefined; isLoading: boolean; colorClass: string }) {
  const rows = data ?? [];
  const ranks = assignCompetitionRanks(rows, matchRankKey);
  return (
    <div className="border rounded">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="py-2">#</TableHead>
            <TableHead className="py-2">Adversário</TableHead>
            <TableHead className="py-2 text-center">Placar</TableHead>
            <TableHead className="py-2">Data</TableHead>
            <TableHead className="py-2 hidden sm:table-cell">Competição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4" /></TableCell></TableRow>
              ))
            : rows.map((m, i) => (
                <TableRow key={m.id} className="text-sm" data-testid={`row-match-${m.id}`}>
                  <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[i])}</TableCell>
                  <TableCell className="py-2 font-medium">{m.opponent}</TableCell>
                  <TableCell className={`py-2 text-center font-bold font-mono ${colorClass}`}>{m.goalsFor}–{m.goalsAgainst}</TableCell>
                  <TableCell className="py-2 text-muted-foreground text-xs">{fmtDate(m.date)}</TableCell>
                  <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">{m.competition}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function MatchRecords() {
  const { data: victories, isLoading: lV } = useGetBiggestVictories({ limit: 10 });
  const { data: defeats, isLoading: lD } = useGetBiggestDefeats({ limit: 10 });
  const { data: streaks, isLoading: lS } = useGetStreaks();

  const winStreak = streaks?.find((s) => s.type === "winning");
  const unbeatenStreak = streaks?.find((s) => s.type === "unbeaten");
  const losingStreak = streaks?.find((s) => s.type === "losing");

  return (
    <div className="space-y-8">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-recordes">Recordes de Partidas</h1>
        <p className="text-sm text-muted-foreground">Maiores goleadas e sequências históricas do CSA</p>
      </div>

      {/* Streaks */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sequências</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {lS
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="border rounded p-4"><Skeleton className="h-12" /></div>)
            : (
              <>
                {winStreak && (
                  <Link
                    href="/registros/sequencias/vitorias"
                    className="border rounded p-4 block hover:bg-muted/40 transition-colors"
                    data-testid="streak-winning"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Vitórias</p>
                    <p className="text-3xl font-black text-green-600 mt-1">{winStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtDate(winStreak.startDate)} — {fmtDate(winStreak.endDate)}</p>
                  </Link>
                )}
                {unbeatenStreak && (
                  <Link
                    href="/registros/sequencias/invencibilidade"
                    className="border rounded p-4 block hover:bg-muted/40 transition-colors"
                    data-testid="streak-unbeaten"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Invencibilidade</p>
                    <p className="text-3xl font-black text-primary mt-1">{unbeatenStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtDate(unbeatenStreak.startDate)} — {fmtDate(unbeatenStreak.endDate)}</p>
                  </Link>
                )}
                {losingStreak && (
                  <Link
                    href="/registros/sequencias/derrotas"
                    className="border rounded p-4 block hover:bg-muted/40 transition-colors"
                    data-testid="streak-losing"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Derrotas</p>
                    <p className="text-3xl font-black text-red-600 mt-1">{losingStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtDate(losingStreak.startDate)} — {fmtDate(losingStreak.endDate)}</p>
                  </Link>
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
  );
}
