import { Link, useParams } from "wouter";
import { useGetCompetition, getGetCompetitionQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function CompetitionDetail() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);

  const { data: comp, isLoading, isError } = useGetCompetition(id, {
    query: { enabled: !!id, queryKey: getGetCompetitionQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !comp) {
    return <div className="text-center p-8 text-destructive">Competição não encontrada.</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/competicoes">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Competições
        </span>
      </Link>

      <div className="border-b pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-competition">{comp.name}</h1>
          {comp.type && <p className="text-sm text-muted-foreground mt-1">{comp.type}</p>}
        </div>
        {comp.titles ? (
          <span className="text-sm bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1.5 rounded font-bold whitespace-nowrap">
            {comp.titles}x Campeão
          </span>
        ) : null}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-5 gap-px bg-border rounded overflow-hidden" data-testid="competition-stat-bar">
        {[
          { label: "Partidas", value: comp.matches, highlight: true },
          { label: "Vitórias", value: comp.wins, color: "text-green-600" },
          { label: "Empates", value: comp.draws, color: "text-amber-600" },
          { label: "Derrotas", value: comp.losses, color: "text-red-600" },
          { label: "Aproveit.", value: pct(comp.wins, comp.matches), highlight: true },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Season history */}
      {comp.seasonStats && comp.seasonStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Histórico por Edição</h2>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Edição</TableHead>
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
                {comp.seasonStats.map((s) => (
                  <TableRow key={s.year} className="text-sm" data-testid={`row-competition-season-${s.year}`}>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/temporadas/${s.year}`} className="hover:text-primary hover:underline">
                        {s.year}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right">{s.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{s.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{s.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{s.losses}</TableCell>
                    <TableCell className="py-2 text-right">{s.goalsScored}</TableCell>
                    <TableCell className="py-2 text-right">{s.goalsConceded}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{pct(s.wins, s.matches)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
