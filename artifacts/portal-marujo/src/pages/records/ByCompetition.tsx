import { useState } from "react";
import { useListCompetitions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";
import type { CompetitionWithVariants } from "@/lib/competition-variants";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function ByCompetition() {
  const { data: competitions, isLoading } = useListCompetitions();
  const rows = (competitions ?? []) as CompetitionWithVariants[];
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
    <RecordsLayout title="Recordes por Competição" subtitle="Desempenho histórico do CSA em cada competição">
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Competição</TableHead>
              <TableHead className="py-2">Tipo</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Aproveita.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : rows.flatMap((c) => {
                  const pct = c.matches > 0 ? ((c.wins / c.matches) * 100).toFixed(1) + "%" : "–";
                  const variants = c.variants ?? [];
                  const open = openIds.has(c.id);
                  const parentRow = (
                    <TableRow key={c.id} className="text-sm" data-testid={`row-competition-${c.id}`}>
                      <TableCell className="py-2 font-medium">
                        <div className="inline-flex items-center gap-1.5">
                          {variants.length > 0 ? (
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              aria-expanded={open}
                              aria-label={open ? "Recolher formatos" : "Ver formatos históricos"}
                              onClick={() => toggle(c.id)}
                              data-testid={`toggle-record-competition-${c.id}`}
                            >
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : null}
                          <Link href={`/competicoes/${c.id}`} className="hover:text-primary hover:underline">
                            {c.name}
                          </Link>
                        </div>
                        {variants.length > 0 ? (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            {variants.length} formatos
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs">{c.type ?? "–"}</TableCell>
                      <TableCell className="py-2 text-right">{c.matches}</TableCell>
                      <TableCell className="py-2 text-right text-green-600 font-medium">{c.wins}</TableCell>
                      <TableCell className="py-2 text-right text-amber-600">{c.draws}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">{c.losses}</TableCell>
                      <TableCell className="py-2 text-right">{c.goalsScored}</TableCell>
                      <TableCell className="py-2 text-right">{c.goalsConceded}</TableCell>
                      <TableCell className="py-2 text-right font-medium">{pct}</TableCell>
                    </TableRow>
                  );
                  if (!open || variants.length === 0) return [parentRow];
                  return [
                    parentRow,
                    ...variants.map((v) => {
                      const vpct = v.matches > 0 ? ((v.wins / v.matches) * 100).toFixed(1) + "%" : "–";
                      return (
                        <TableRow key={`${c.id}-${v.id}`} className="text-sm bg-muted/30" data-testid={`row-record-variant-${v.id}`}>
                          <TableCell className="py-2 pl-8 font-medium">
                            <Link href={`/competicoes/${v.id}`} className="hover:text-primary hover:underline text-muted-foreground">
                              {v.name}
                            </Link>
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground text-xs">{v.type ?? "–"}</TableCell>
                          <TableCell className="py-2 text-right">{v.matches}</TableCell>
                          <TableCell className="py-2 text-right text-green-600 font-medium">{v.wins}</TableCell>
                          <TableCell className="py-2 text-right text-amber-600">{v.draws}</TableCell>
                          <TableCell className="py-2 text-right text-red-600">{v.losses}</TableCell>
                          <TableCell className="py-2 text-right">{v.goalsScored}</TableCell>
                          <TableCell className="py-2 text-right">{v.goalsConceded}</TableCell>
                          <TableCell className="py-2 text-right font-medium">{vpct}</TableCell>
                        </TableRow>
                      );
                    }),
                  ];
                })}
          </TableBody>
        </Table>
      </div>
    </RecordsLayout>
  );
}
