import { useState } from "react";
import { Link } from "wouter";
import { useListCompetitions } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BrazilFlag } from "@/components/BrazilFlag";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";
import type { CompetitionWithVariants } from "@/lib/competition-variants";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const rows = (competitions ?? []) as CompetitionWithVariants[];
  const ranks = assignCompetitionRanks(rows, (c) => c.matches);
  const { page, setPage, pageSize, total, slice, needsPagination, rankOffset } = useClientPage(rows);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
              : slice.flatMap((c, i) => {
                  const variants = c.variants ?? [];
                  const open = openIds.has(c.id);
                  const parentRow = (
                    <TableRow key={c.id} className="text-sm" data-testid={`row-competition-${c.id}`}>
                      <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[rankOffset + i])}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <div className="inline-flex items-center gap-1.5">
                          {variants.length > 0 ? (
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              aria-expanded={open}
                              aria-label={open ? "Recolher formatos" : "Ver formatos históricos"}
                              onClick={() => toggle(c.id)}
                              data-testid={`toggle-competition-${c.id}`}
                            >
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : null}
                          <Link href={`/competicoes/${c.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1.5" data-testid={`link-competition-${c.id}`}>
                            <BrazilFlag size="sm" title="Brasil" />
                            {c.name}
                          </Link>
                        </div>
                        {variants.length > 0 ? (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            {variants.length} formatos
                          </span>
                        ) : null}
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
                  );
                  if (!open || variants.length === 0) return [parentRow];
                  return [
                    parentRow,
                    ...variants.map((v) => (
                      <TableRow key={`${c.id}-${v.id}`} className="text-sm bg-muted/30" data-testid={`row-competition-variant-${v.id}`}>
                        <TableCell className="py-2" />
                        <TableCell className="py-2 pl-8 font-medium">
                          <Link href={`/competicoes/${v.id}`} className="hover:text-primary hover:underline text-muted-foreground">
                            {v.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground text-xs">{nivel(v.type)}</TableCell>
                        <TableCell className="py-2 text-right">{v.matches}</TableCell>
                        <TableCell className="py-2 text-right text-green-600 font-medium">{v.wins}</TableCell>
                        <TableCell className="py-2 text-right text-amber-600">{v.draws}</TableCell>
                        <TableCell className="py-2 text-right text-red-600">{v.losses}</TableCell>
                        <TableCell className="py-2 text-right">{v.goalsScored}</TableCell>
                        <TableCell className="py-2 text-right">{v.goalsConceded}</TableCell>
                        <TableCell className="py-2 text-right font-medium">{pct(v.wins, v.matches)}</TableCell>
                        <TableCell className="py-2 text-right text-muted-foreground text-xs">{v.lastParticipation ?? "–"}</TableCell>
                      </TableRow>
                    )),
                  ];
                })}
          </TableBody>
        </Table>
      </div>

      {needsPagination && (
        <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} label=" competições" />
      )}
    </div>
  );
}
