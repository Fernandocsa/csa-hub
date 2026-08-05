import { Link, useParams } from "wouter";
import { useGetPlayerMatches } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { PlayerMatchHistoryTable } from "@/components/PlayerMatchHistoryTable";

export default function PlayerMatches() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, isError } = useGetPlayerMatches(id);

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-5xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 max-w-5xl">
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
    <div className="space-y-5 max-w-5xl">
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
            ? "Nenhum jogo relacionado nas fichas cadastradas"
            : [
                (data.playedTotal ?? data.total) > 0
                  ? `${data.playedTotal ?? data.total} ${
                      (data.playedTotal ?? data.total) === 1 ? "jogo" : "jogos"
                    } em campo`
                  : null,
                (data.unusedBenchTotal ?? 0) > 0
                  ? `${data.unusedBenchTotal} NU (reserva não utilizado)`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
      </div>

      {data.matches.length > 0 ? (
        <div className="space-y-2">
          <PlayerMatchHistoryTable matches={data.matches} />
          {(data.unusedBenchTotal ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              NU = Reserva não utilizado. Esses jogos não entram nas estatísticas
              do atleta.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Este jogador ainda não consta como titular, reserva que entrou ou
          reserva não utilizado em nenhuma ficha cadastrada.
        </p>
      )}
    </div>
  );
}
