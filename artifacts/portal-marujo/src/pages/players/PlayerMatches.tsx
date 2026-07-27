import { Link, useParams } from "wouter";
import { useGetPlayerMatches } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { PlayerMatchRows } from "@/components/PlayerMatchRows";

export default function PlayerMatches() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, isError } = useGetPlayerMatches(id);

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
        <Link href={id ? `/jogadores/${id}` : "/jogadores"}>
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
      <Link href={`/jogadores/${data.playerId}`}>
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para {data.playerName}
        </span>
      </Link>

      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-player-matches">
          Jogos — {data.playerName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.total === 0
            ? "Nenhum jogo com ficha detalhada disponível"
            : `${data.total} ${data.total === 1 ? "jogo" : "jogos"} com ficha CSA`}
        </p>
      </div>

      {data.matches.length > 0 ? (
        <PlayerMatchRows matches={data.matches} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Este jogador ainda não aparece em nenhuma escalação cadastrada.
        </p>
      )}
    </div>
  );
}
