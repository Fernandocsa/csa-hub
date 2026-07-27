import { Link } from "wouter";
import { useGetRefereesByState } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { ufDisplayName } from "@/lib/br-locations";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default function RefereesByState() {
  const { data, isLoading, isError } = useGetRefereesByState();

  const states = data?.states ?? [];
  const unknown = data?.unknown;
  const totalMatches =
    states.reduce((s, r) => s + r.matches, 0) + (unknown?.matches ?? 0);
  const totalReferees =
    states.reduce((s, r) => s + r.refereeCount, 0) + (unknown?.refereeCount ?? 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-arbitros-por-estado">
          Árbitros por Estado
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico do CSA quando apitado por árbitros de cada federação (UF)
        </p>
      </div>

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-px bg-border rounded overflow-hidden">
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              UFs com jogos
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">{states.length}</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Partidas / Árbitros
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">
              {totalMatches}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {totalReferees}
              </span>
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-destructive">Erro ao carregar estados.</p>
      ) : states.length === 0 && !unknown ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum árbitro com partidas e UF cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {states.map((row) => (
            <Link
              key={row.state}
              href={`/arbitros/por-estado/${row.state}`}
              className="block border rounded p-4 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="font-bold text-lg">
                    {row.state}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {ufDisplayName(row.state!)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {row.refereeCount} árbitro{row.refereeCount === 1 ? "" : "s"}
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

          {unknown && (
            <Link
              href="/arbitros/por-estado/sem-estado"
              className="block border rounded p-4 hover:bg-accent/40 transition-colors border-dashed"
            >
              <p className="font-bold text-lg">Sem estado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unknown.refereeCount} árbitro
                {unknown.refereeCount === 1 ? "" : "s"} sem UF
              </p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                <span className="font-semibold">{unknown.matches}J</span>
                <span className="text-green-600">{unknown.wins}V</span>
                <span className="text-amber-600">{unknown.draws}E</span>
                <span className="text-red-600">{unknown.losses}D</span>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
