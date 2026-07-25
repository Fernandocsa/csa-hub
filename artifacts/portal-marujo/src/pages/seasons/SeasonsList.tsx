import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useListSeasons } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function pctVal(wins: number, total: number): number {
  if (!total) return 0;
  return (wins / total) * 100;
}

type SortKey =
  | "year" | "matches" | "wins" | "draws" | "losses"
  | "goalsScored" | "goalsConceded" | "saldo" | "aproveit" | "artilheiro";

type SortDir = "desc" | "asc";

type Season = {
  year: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  topScorer?: string | null;
  topScorerGoals?: number | null;
};

function getSortValue(s: Season, key: SortKey): number | string {
  switch (key) {
    case "year":       return s.year;
    case "matches":    return s.matches;
    case "wins":       return s.wins;
    case "draws":      return s.draws;
    case "losses":     return s.losses;
    case "goalsScored":    return s.goalsScored;
    case "goalsConceded":  return s.goalsConceded;
    case "saldo":      return s.goalsScored - s.goalsConceded;
    case "aproveit":   return pctVal(s.wins, s.matches);
    case "artilheiro": return s.topScorerGoals ?? -1;
  }
}

function SortIcon({ colKey, sortKey, sortDir }: { colKey: SortKey; sortKey: SortKey | null; sortDir: SortDir | null }) {
  if (sortKey !== colKey || !sortDir) return <span className="ml-1 opacity-0 select-none">▼</span>;
  return <span className="ml-1 text-foreground">{sortDir === "desc" ? "▼" : "▲"}</span>;
}

export default function SeasonsList() {
  const { data: seasons, isLoading } = useListSeasons();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  const sorted = useMemo(() => {
    if (!seasons) return seasons;
    if (!sortKey || !sortDir) return seasons;
    return [...seasons].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const dir = sortDir === "desc" ? -1 : 1;
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
      return ((va as number) - (vb as number)) * dir;
    });
  }, [seasons, sortKey, sortDir]);

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

  function th(
    label: string,
    key: SortKey,
    className = "py-2 text-right cursor-pointer select-none hover:text-foreground transition-colors"
  ) {
    const active = sortKey === key;
    return (
      <TableHead
        className={`${className} ${active ? "text-foreground" : "text-muted-foreground"}`}
        onClick={() => handleSort(key)}
      >
        {label}
        <SortIcon colKey={key} sortKey={sortKey} sortDir={sortDir} />
      </TableHead>
    );
  }

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
              {th("Temporada", "year",
                "py-2 cursor-pointer select-none hover:text-foreground transition-colors " +
                (sortKey === "year" ? "text-foreground" : "text-muted-foreground")
              )}
              {th("J",         "matches")}
              {th("V",         "wins",         "py-2 text-right text-green-600 cursor-pointer select-none hover:text-green-700 transition-colors")}
              {th("E",         "draws",        "py-2 text-right text-amber-600 cursor-pointer select-none hover:text-amber-700 transition-colors")}
              {th("D",         "losses",       "py-2 text-right text-red-600 cursor-pointer select-none hover:text-red-700 transition-colors")}
              {th("GP",        "goalsScored")}
              {th("GC",        "goalsConceded")}
              {th("Saldo",     "saldo")}
              {th("Aproveit.", "aproveit")}
              <TableHead
                className={`py-2 text-right hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors ${sortKey === "artilheiro" ? "text-foreground" : "text-muted-foreground"}`}
                onClick={() => handleSort("artilheiro")}
              >
                Artilheiro
                <SortIcon colKey="artilheiro" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : sorted?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">Sem temporadas.</TableCell>
                  </TableRow>
                )
              : sorted?.map((s) => {
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
            {/* Totals row — always at bottom regardless of sort */}
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
