import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useGetTransfers, type TransferDirection } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ListPagination";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { OpponentHistoryLink } from "@/components/MatchNavLinks";
import { useClientPage } from "@/hooks/useClientPage";
import { formatDateBr } from "@/lib/utils";

function directionLabel(d: TransferDirection) {
  return d === "in" ? "No CSA (chegado por empréstimo)" : "Emprestado pelo CSA";
}

function clubPrep(direction: TransferDirection, club: string | null) {
  if (!club) return null;
  return direction === "in" ? "vindo de" : "no";
}

export default function LoanedPlayers() {
  const [season, setSeason] = useState("");
  const [direction, setDirection] = useState<TransferDirection | "">("");
  const { data, isLoading } = useGetTransfers({
    season: season || undefined,
    direction,
    loansOnly: true,
  });

  const transfers = data?.transfers ?? [];
  const seasons = data?.seasons ?? [];

  const { page, setPage, pageSize, total, slice, needsPagination } =
    useClientPage(transfers);

  const pageGrouped = useMemo(() => {
    const map = new Map<string, typeof transfers>();
    for (const t of slice) {
      const list = map.get(t.season) ?? [];
      list.push(t);
      map.set(t.season, list);
    }
    return [...map.entries()];
  }, [slice, transfers]);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-emprestados">
          Jogadores Emprestados
        </h1>
        <p className="text-sm text-muted-foreground">
          Movimentações cadastradas como empréstimo — saídas do CSA e
          chegadas por empréstimo
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Cadastre com tipo{" "}
          <span className="font-medium text-foreground">empréstimo</span> em{" "}
          <Link href="/transferencias" className="text-primary hover:underline">
            Transferências
          </Link>{" "}
          (admin) para aparecer aqui.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="h-8 border rounded px-2 text-sm bg-background"
          value={season}
          onChange={(e) => {
            setSeason(e.target.value);
            setPage(1);
          }}
          data-testid="filter-season-loans"
        >
          <option value="">Todas as temporadas</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1">
          {(
            [
              { value: "", label: "Todos" },
              { value: "out", label: "Emprestados pelo CSA" },
              { value: "in", label: "Emprestados no CSA" },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.value || "all"}
              type="button"
              size="sm"
              variant={direction === opt.value ? "default" : "outline"}
              className="h-8"
              onClick={() => {
                setDirection(opt.value);
                setPage(1);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum empréstimo cadastrado ainda.
        </p>
      ) : (
        <>
          <div className="space-y-6">
            {pageGrouped.map(([seasonKey, rows]) => (
              <section key={seasonKey}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Temporada {seasonKey}
                </h2>
                <ul className="border rounded divide-y">
                  {rows.map((t) => {
                    const prep = clubPrep(t.direction, t.club);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm"
                      >
                        <Link
                          href={`/jogadores/${t.playerId}`}
                          className="shrink-0"
                          aria-label={t.playerName}
                        >
                          <PlayerPhoto
                            url={t.playerPhotoUrl}
                            name={t.playerName}
                            size="sm"
                          />
                        </Link>
                        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className={`text-xs font-semibold uppercase tracking-wide shrink-0 ${
                              t.direction === "in"
                                ? "text-green-700"
                                : "text-amber-700"
                            }`}
                          >
                            {t.direction === "out" ? "Saída" : "Chegada"}
                          </span>
                          <Link
                            href={`/jogadores/${t.playerId}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {t.playerName}
                          </Link>
                          {t.club && prep && (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground min-w-0">
                              <span>{prep}</span>
                              <OpponentHistoryLink
                                opponentId={t.opponentId}
                                name={t.club}
                                logoUrl={t.clubLogoUrl}
                                crestAfter={false}
                                crestFallback
                                className="text-foreground"
                              />
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            · {directionLabel(t.direction)}
                          </span>
                          {t.transferDate && (
                            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                              {formatDateBr(t.transferDate)}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
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
