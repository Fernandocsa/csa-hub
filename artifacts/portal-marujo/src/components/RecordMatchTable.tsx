import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { OpponentNameWithCrest } from "@/components/OpponentCrest";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
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
 * Used by /registros and /partidas/recordes.
 */
export function RecordMatchTable({
  data,
  isLoading,
  colorClass,
  clickable = false,
  hideCompetitionOnMobile = false,
}: {
  data: RecordMatchRow[] | undefined;
  isLoading: boolean;
  colorClass: string;
  /** Navigate to match detail on row click (Visão Geral). */
  clickable?: boolean;
  hideCompetitionOnMobile?: boolean;
}) {
  const [, setLocation] = useLocation();
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
                <TableRow
                  key={m.id}
                  className={`text-sm${clickable ? " cursor-pointer hover:bg-muted/40" : ""}`}
                  onClick={clickable ? () => setLocation(`/partidas/${m.id}`) : undefined}
                  data-testid={`row-match-${m.id}`}
                >
                  <TableCell className="py-1.5 text-muted-foreground text-xs">
                    {formatCompetitionRank(ranks[i])}
                  </TableCell>
                  <TableCell className="py-1.5 font-medium">
                    <OpponentNameWithCrest name={m.opponent} logoUrl={m.opponentLogoUrl} />
                  </TableCell>
                  <TableCell className={`py-1.5 text-center font-bold font-mono ${colorClass}`}>
                    {m.goalsFor}–{m.goalsAgainst}
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
