import { Link } from "wouter";
import { useGetPlayersByBirthState } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { BRAZIL_UFS, ufDisplayName } from "@/lib/br-locations";

const VALID_UF = new Set<string>(BRAZIL_UFS);

export default function PlayersByState() {
  const { data, isLoading, isError } = useGetPlayersByBirthState();

  const states = (data?.states ?? []).filter(
    (r) => r.state && VALID_UF.has(r.state.toUpperCase()),
  );
  const unknown = data?.unknown;
  const totalPlayers =
    states.reduce((s, r) => s + r.playerCount, 0) + (unknown?.playerCount ?? 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-por-estado">
          Por Estado
        </h1>
        <p className="text-sm text-muted-foreground">
          Jogadores do CSA agrupados pelo estado de nascimento
        </p>
      </div>

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-px bg-border rounded overflow-hidden">
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Estados representados
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">{states.length}</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Jogadores com UF
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">
              {totalPlayers - (unknown?.playerCount ?? 0)}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-destructive">Erro ao carregar estados.</p>
      ) : states.length === 0 && !unknown ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum jogador com estado de nascimento cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Por UF
          </h2>
          <div className="flex flex-wrap gap-2">
            {states.map((row) => (
              <Link
                key={row.state}
                href={`/jogadores/por-estado/${row.state}`}
                data-testid={`link-birth-state-${row.state}`}
              >
                <span className="inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                  <span className="font-bold">{row.state}</span>
                  <span className="text-muted-foreground text-xs">
                    {ufDisplayName(row.state!)}
                  </span>
                  <span className="text-muted-foreground">({row.playerCount})</span>
                </span>
              </Link>
            ))}
            {unknown && (
              <Link href="/jogadores/por-estado/sem-estado">
                <span className="inline-flex items-center gap-1.5 border border-dashed rounded-full px-3 py-1 text-sm hover:bg-accent cursor-pointer transition-colors">
                  Sem estado
                  <span className="text-muted-foreground">({unknown.playerCount})</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
