import { Link } from "wouter";
import { useGetTitles } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";

export default function Titles() {
  const { data, isLoading, isError } = useGetTitles();

  return (
    <RecordsLayout
      title="Títulos"
      subtitle="Campeonatos marcados como título no resumo por competição de cada temporada"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Erro ao carregar títulos.</p>
      ) : data.total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum título cadastrado ainda. No admin, marque a coluna “Título” na
          temporada/competição correspondente.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="border rounded p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-4xl font-black text-primary mt-0.5">
              {data.total}
              <span className="text-base font-normal text-muted-foreground ml-2">
                {data.total === 1 ? "título" : "títulos"}
              </span>
            </p>
          </div>

          <div className="space-y-5">
            {data.competitions.map((c) => (
              <section key={c.competitionId} className="border rounded overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    <Link
                      href={`/competicoes/${c.competitionId}`}
                      className="hover:text-primary hover:underline"
                    >
                      {c.competitionName}
                    </Link>
                  </h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {c.count} {c.count === 1 ? "título" : "títulos"}
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
                  {(c.formats ?? c.seasons.map((year) => ({ season: year, competitionId: c.competitionId, competitionName: c.competitionName }))).map((item, i) => (
                    <span key={`${item.season}-${item.competitionId}`} className="inline-flex items-baseline gap-3">
                      {i > 0 ? (
                        <span className="text-muted-foreground/40 select-none" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <Link
                        href={`/temporadas/${item.season}`}
                        className="font-medium tabular-nums hover:text-primary hover:underline"
                      >
                        {item.season}
                      </Link>
                      {item.competitionName !== c.competitionName ? (
                        <span className="text-xs text-muted-foreground">
                          {item.competitionName}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </RecordsLayout>
  );
}
