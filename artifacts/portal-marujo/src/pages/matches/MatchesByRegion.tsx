import { Link } from "wouter";
import { useGetOpponentsByRegion } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Map } from "lucide-react";
import { regionDisplayName } from "@/lib/br-regions";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default function MatchesByRegion() {
  const { data, isLoading, isError } = useGetOpponentsByRegion();

  const regions = data?.regions ?? [];
  const totalMatches = regions.reduce((s, r) => s + r.matches, 0);
  const totalOpponents = regions.reduce((s, r) => s + r.opponentCount, 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-csa-x-regioes">
          CSA x Regiões
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico agregado do CSA contra times de cada região do Brasil
        </p>
      </div>

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-px bg-border rounded overflow-hidden">
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Regiões com jogos
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">{regions.length}</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Partidas / Times
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">
              {totalMatches}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {totalOpponents}
              </span>
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-destructive">Erro ao carregar regiões.</p>
      ) : regions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Map className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Nenhuma região com partidas oficiais ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regions.map((row) => (
            <Link
              key={row.slug}
              href={`/partidas/por-regiao/${row.slug}`}
              className="block border rounded p-4 hover:bg-accent/40 transition-colors"
              data-testid={`link-region-${row.slug}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="font-bold text-lg">{regionDisplayName(row.region)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {row.stateCount} estado{row.stateCount === 1 ? "" : "s"} ·{" "}
                    {row.opponentCount} time{row.opponentCount === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-sm font-medium">{pct(row.wins, row.matches)}</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                <span className="font-semibold">{row.matches}J</span>
                <span className="text-green-600">{row.wins}V</span>
                <span className="text-amber-600">{row.draws}E</span>
                <span className="text-red-600">{row.losses}D</span>
                <span className="text-muted-foreground">
                  {row.goalsFor}:{row.goalsAgainst}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
