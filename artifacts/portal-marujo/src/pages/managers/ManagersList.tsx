import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useListManagers } from "@workspace/api-client-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";
import { foldAccents, includesFolded } from "@/lib/accent-fold";

export default function ManagersList() {
  const { data: managers, isLoading } = useListManagers();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const all = managers ?? [];
    const q = foldAccents(search).trim();
    if (q.length < 1) return all;
    return all.filter(
      (m) =>
        includesFolded(m.name, q) ||
        (m.fullName != null && includesFolded(m.fullName, q)),
    );
  }, [managers, search]);

  const ranks = assignCompetitionRanks(rows, (m) => m.matches);
  const { page, setPage, pageSize, total, slice, needsPagination, rankOffset } = useClientPage(rows);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-tecnicos">Técnicos</h1>
        <p className="text-sm text-muted-foreground">Histórico de treinadores que comandaram o CSA</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Buscar técnico..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-full sm:w-64 text-sm"
          data-testid="input-search-manager"
        />
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Treinador</TableHead>
              <TableHead className="py-2 text-right">Período</TableHead>
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
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-4" /></TableCell></TableRow>
                ))
              : slice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">Nenhum técnico encontrado.</TableCell>
                  </TableRow>
                )
              : slice.map((m, i) => (
                  <TableRow key={m.id} className="text-sm" data-testid={`row-manager-${m.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[rankOffset + i])}</TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/tecnicos/${m.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1" data-testid={`link-manager-${m.id}`}>
                        {m.name}
                        <VerifiedBadge status={m.verificationStatus} />
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {m.startYear != null
                        ? m.endYear != null && m.endYear !== m.startYear
                          ? `${m.startYear}–${m.endYear}`
                          : String(m.startYear)
                        : "–"}
                    </TableCell>
                    <TableCell className="py-2 text-right">{m.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600 font-medium">{m.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{m.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{m.losses}</TableCell>
                    <TableCell className="py-2 text-right">
                      {(m as { goalsFor?: number; goalsScored?: number }).goalsFor ??
                        (m as { goalsScored?: number }).goalsScored ??
                        "–"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {(m as { goalsAgainst?: number; goalsConceded?: number }).goalsAgainst ??
                        (m as { goalsConceded?: number }).goalsConceded ??
                        "–"}
                    </TableCell>
                    <TableCell className="py-2 text-right font-bold text-primary">{(m.winPercentage ?? 0).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {needsPagination && (
        <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} label=" técnicos" />
      )}
    </div>
  );
}
