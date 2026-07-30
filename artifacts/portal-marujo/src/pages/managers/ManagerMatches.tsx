import { Link, useParams } from "wouter";
import { useGetManagerMatches } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { MatchRows } from "@/components/MatchRows";

export default function ManagerMatches() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, isError } = useGetManagerMatches(id);

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 max-w-3xl">
        <Link href={id ? `/tecnicos/${id}` : "/tecnicos"}>
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </span>
        </Link>
        <p className="text-destructive">Não foi possível carregar os jogos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href={`/tecnicos/${data.managerId}`}>
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para {data.managerName}
        </span>
      </Link>

      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-manager-matches">
          Jogos — {data.managerName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.total === 0
            ? "Nenhuma partida cadastrada com este técnico"
            : `${data.total} ${data.total === 1 ? "partida" : "partidas"} à frente do CSA`}
        </p>
      </div>

      {data.matches.length > 0 ? (
        <MatchRows matches={data.matches} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Este técnico ainda não aparece em nenhuma partida cadastrada.
        </p>
      )}
    </div>
  );
}
