import { Link, useParams } from "wouter";
import { useGetManager, getGetManagerQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { EntityBadges } from "@/components/EntityBadges";
import { EntityComments } from "@/components/EntityComments";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";
import { VerificationCard } from "@/components/VerificationCard";
import { BrazilFlag, isBrazilianNationality } from "@/components/BrazilFlag";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

export default function ManagerDetail() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);

  const { data: manager, isLoading, isError } = useGetManager(id, {
    query: { enabled: !!id, queryKey: getGetManagerQueryKey(id) },
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

  if (isError || !manager) {
    return <div className="text-center p-8 text-destructive">Técnico não encontrado.</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/tecnicos">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Técnicos
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-manager">{manager.name}</h1>
          <VerificationCard
            status={manager.verificationStatus}
            verifiedBy={manager.verifiedBy}
            verifiedAt={manager.verifiedAt}
          />
        </div>
        {(manager.nationality || manager.startYear != null) && (
          <p className="text-sm text-muted-foreground mt-1 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {manager.nationality && (
              <span className="inline-flex items-center gap-1">
                {isBrazilianNationality(manager.nationality) && (
                  <BrazilFlag size="sm" title={manager.nationality} />
                )}
                <span>{manager.nationality}</span>
              </span>
            )}
            {manager.nationality && manager.startYear != null && <span aria-hidden>·</span>}
            {manager.startYear != null && (
              <span>
                {manager.endYear != null && manager.endYear !== manager.startYear
                  ? `${manager.startYear}–${manager.endYear}`
                  : String(manager.startYear)}
              </span>
            )}
          </p>
        )}
        <EntityBadges
          badges={
            (manager as { badges?: { id: number; label: string; source?: string }[] })
              .badges
          }
        />
      </div>

      <StarRating entityType="manager" entityId={manager.id} />

      {/* Stat bar */}
      <div className="grid grid-cols-5 gap-px bg-border rounded overflow-hidden" data-testid="manager-stat-bar">
        {[
          { label: "Partidas", value: manager.matches, highlight: true },
          { label: "Vitórias", value: manager.wins, color: "text-green-600" },
          { label: "Empates", value: manager.draws, color: "text-amber-600" },
          { label: "Derrotas", value: manager.losses, color: "text-red-600" },
          { label: "Aproveit.", value: `${(manager.winPercentage ?? 0).toFixed(1)}%`, highlight: true },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Season-by-season */}
      {manager.seasonStats && manager.seasonStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Histórico por Temporada</h2>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Ano</TableHead>
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right text-green-600">V</TableHead>
                  <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                  <TableHead className="py-2 text-right text-red-600">D</TableHead>
                  <TableHead className="py-2 text-right">Aproveit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manager.seasonStats.map((s) => (
                  <TableRow key={s.year} className="text-sm" data-testid={`row-manager-season-${s.year}`}>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/temporadas/${s.year}`} className="hover:text-primary hover:underline">
                        {s.year}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right">{s.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{s.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{s.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{s.losses}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{pct(s.wins, s.matches)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <EntityComments entityType="manager" entityId={manager.id} />
      <EntitySuggestionForm entityType="manager" entityId={manager.id} />
    </div>
  );
}
