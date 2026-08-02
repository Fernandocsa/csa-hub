import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

import { formatDateBr } from "@/lib/utils";

function fmtDate(d: string) {
  return formatDateBr(d);
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

export type RecordMatchRow = {
  id: number;
  opponentId?: number;
  opponent: string;
  opponentLogoUrl?: string | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  result?: string;
  date: string;
  competition?: string | null;
};

/**
 * Shared goleadas / recordes match table (escudo + adversário).
 * Opponent → histórico; placar → partida.
 */
export function RecordMatchTable({
  data,
  isLoading,
  colorClass,
  hideCompetitionOnMobile = false,
}: {
  data: RecordMatchRow[] | undefined;
  isLoading: boolean;
  colorClass: string;
  /** @deprecated Row click removed; use score/opponent links. */
  clickable?: boolean;
  hideCompetitionOnMobile?: boolean;
}) {
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
            <TableHead className={`py-2${hideCompetitionOnMobile ? " hidden sm:table-cell" : ""}`}>
              Competição
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4" />
                  </TableCell>
                </TableRow>
              ))
            : rows.map((m, i) => (
                <TableRow key={m.id} className="text-sm" data-testid={`row-match-${m.id}`}>
                  <TableCell className="py-1.5 text-muted-foreground text-xs">
                    {formatCompetitionRank(ranks[i])}
                  </TableCell>
                  <TableCell className="py-1.5 font-medium">
                    <OpponentHistoryLink
                      opponentId={m.opponentId}
                      name={m.opponent}
                      logoUrl={m.opponentLogoUrl}
                    />
                  </TableCell>
                  <TableCell className={`py-1.5 text-center ${colorClass}`}>
                    <MatchScoreLink matchId={m.id} className={colorClass}>
                      {m.goalsFor}–{m.goalsAgainst}
                    </MatchScoreLink>
                  </TableCell>
                  <TableCell className="py-1.5 text-muted-foreground text-xs">
                    {fmtDate(m.date)}
                  </TableCell>
                  <TableCell
                    className={`py-1.5 text-muted-foreground text-xs${
                      hideCompetitionOnMobile ? " hidden sm:table-cell" : ""
                    }`}
                  >
                    {m.competition}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
