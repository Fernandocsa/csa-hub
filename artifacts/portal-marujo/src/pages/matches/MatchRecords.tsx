import { Link } from "wouter";
import { useGetBiggestVictories, useGetBiggestDefeats, useGetStreaks } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordMatchTable } from "@/components/RecordMatchTable";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function MatchRecords() {
  const { data: victories, isLoading: lV } = useGetBiggestVictories({ limit: 10 });
  const { data: defeats, isLoading: lD } = useGetBiggestDefeats({ limit: 10 });
  const { data: streaks, isLoading: lS } = useGetStreaks();

  const winStreak = streaks?.find((s) => s.type === "winning");
  const unbeatenStreak = streaks?.find((s) => s.type === "unbeaten");
  const losingStreak = streaks?.find((s) => s.type === "losing");

  return (
    <div className="space-y-8">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-recordes">Recordes de Partidas</h1>
        <p className="text-sm text-muted-foreground">Maiores goleadas e sequências históricas do CSA</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sequências</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {lS
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded p-4">
                  <Skeleton className="h-12" />
                </div>
              ))
            : (
              <>
                {winStreak && (
                  <Link
                    href="/registros/sequencias/vitorias"
                    className="border rounded p-4 block hover:bg-muted/40 transition-colors"
                    data-testid="streak-winning"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Vitórias</p>
                    <p className="text-3xl font-black text-green-600 mt-1">
                      {winStreak.length}{" "}
                      <span className="text-sm font-normal text-muted-foreground">jogos</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(winStreak.startDate)} — {fmtDate(winStreak.endDate)}
                    </p>
                  </Link>
                )}
                {unbeatenStreak && (
                  <Link
                    href="/registros/sequencias/invencibilidade"
                    className="border rounded p-4 block hover:bg-muted/40 transition-colors"
                    data-testid="streak-unbeaten"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Invencibilidade</p>
                    <p className="text-3xl font-black text-primary mt-1">
                      {unbeatenStreak.length}{" "}
                      <span className="text-sm font-normal text-muted-foreground">jogos</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(unbeatenStreak.startDate)} — {fmtDate(unbeatenStreak.endDate)}
                    </p>
                  </Link>
                )}
                {losingStreak && (
                  <Link
                    href="/registros/sequencias/derrotas"
                    className="border rounded p-4 block hover:bg-muted/40 transition-colors"
                    data-testid="streak-losing"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Derrotas</p>
                    <p className="text-3xl font-black text-red-600 mt-1">
                      {losingStreak.length}{" "}
                      <span className="text-sm font-normal text-muted-foreground">jogos</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(losingStreak.startDate)} — {fmtDate(losingStreak.endDate)}
                    </p>
                  </Link>
                )}
              </>
            )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            10 Maiores Vitórias
          </h2>
          <RecordMatchTable
            data={victories}
            isLoading={lV}
            colorClass="text-green-600"
            hideCompetitionOnMobile
          />
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            10 Maiores Derrotas
          </h2>
          <RecordMatchTable
            data={defeats}
            isLoading={lD}
            colorClass="text-red-600"
            hideCompetitionOnMobile
          />
        </section>
      </div>
    </div>
  );
}
