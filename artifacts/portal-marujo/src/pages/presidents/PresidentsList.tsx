import { useGetPresidents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityPhoto } from "@/components/EntityPhoto";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { formatDateBr } from "@/lib/utils";

function termLabel(start: string | null, end: string | null) {
  const fmt = (d: string | null) => {
    if (!d) return null;
    if (/^\d{4}-01-01$/.test(d)) return d.slice(0, 4);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return formatDateBr(d);
    return d;
  };
  const a = fmt(start);
  const b = end ? fmt(end) : "atual";
  if (!a && !end) return "Período não informado";
  if (!a) return `até ${b}`;
  return `${a} — ${b}`;
}

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
            {slice.map((p) => (
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
                    {termLabel(p.termStart, p.termEnd)}
                  </p>
                  {p.notes && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                      {p.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
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
    </div>
  );
}
