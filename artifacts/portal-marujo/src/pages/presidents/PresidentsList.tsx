import { Link } from "wouter";
import { useGetPresidents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityPhoto } from "@/components/EntityPhoto";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import {
  presidentPassageOrdinalLabel,
  presidentTermLabel,
} from "@/lib/president-term";

export default function PresidentsList() {
  const { data, isLoading } = useGetPresidents();
  const rows = data ?? [];
  const { page, setPage, pageSize, total, slice, needsPagination } = useClientPage(rows);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-presidentes">
          Presidentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Mandatos à frente do Centro Sportivo Alagoano
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum presidente cadastrado ainda.
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {slice.map((p) => {
              const passageLabel =
                p.passageIndex != null && p.passageCount != null
                  ? presidentPassageOrdinalLabel(p.passageIndex, p.passageCount)
                  : null;
              const otherTerms = p.otherTerms ?? [];
              return (
                <li
                  key={p.id}
                  className="flex gap-4 border-b pb-4 last:border-0"
                  data-testid={`president-${p.id}`}
                >
                  <EntityPhoto
                    url={p.photoUrl}
                    name={p.name}
                    size="lg"
                    label={`Foto de ${p.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-lg leading-tight">{p.name}</h2>
                    <p className="text-sm text-primary font-medium mt-0.5">
                      {presidentTermLabel(p.termStart, p.termEnd, !!p.isCurrent)}
                      {passageLabel ? (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {passageLabel}
                        </span>
                      ) : null}
                    </p>
                    {otherTerms.length > 0 ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Outras passagens:{" "}
                        {otherTerms.map((t, i) => (
                          <span key={t.id}>
                            {i > 0 ? " · " : null}
                            {presidentTermLabel(t.termStart, t.termEnd, t.isCurrent)}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    {(p.linkedPlayerId || p.linkedManagerId) && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {p.linkedPlayerId ? (
                          <Link
                            href={`/jogadores/${p.linkedPlayerId}`}
                            className="text-primary hover:underline"
                          >
                            Ver como jogador
                            {p.linkedPlayerName ? ` (${p.linkedPlayerName})` : ""} →
                          </Link>
                        ) : null}
                        {p.linkedManagerId ? (
                          <Link
                            href={`/tecnicos/${p.linkedManagerId}`}
                            className="text-primary hover:underline"
                          >
                            Ver como técnico
                            {p.linkedManagerName
                              ? ` (${p.linkedManagerName})`
                              : ""}{" "}
                            →
                          </Link>
                        ) : null}
                      </p>
                    )}
                    {p.notes && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                        {p.notes}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {needsPagination && (
            <ListPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <p className="text-sm text-muted-foreground border-t pt-4">
        Falta um mandato ou tem uma correção?{" "}
        <Link href="/sugestoes" className="text-primary hover:underline">
          Envie uma sugestão →
        </Link>
      </p>
    </div>
  );
}
