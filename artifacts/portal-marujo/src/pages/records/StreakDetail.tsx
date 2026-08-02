import { Link } from "wouter";
import { useGetStreakDetail, type StreakDetailType } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";
import { RecordsLayout } from "./RecordsLayout";
import { cn, formatDateBr } from "@/lib/utils";

function fmtDate(d: string) {
  return formatDateBr(d);
}

const META: Record<
  StreakDetailType,
  { title: string; subtitle: string; color: string }
> = {
  winning: {
    title: "Maior Sequência de Vitórias",
    subtitle: "Jogos da melhor sequência de vitórias consecutivas do CSA",
    color: "text-green-600",
  },
  unbeaten: {
    title: "Maior Invencibilidade",
    subtitle: "Jogos da melhor sequência sem derrota do CSA",
    color: "text-primary",
  },
  losing: {
    title: "Maior Sequência de Derrotas",
    subtitle: "Jogos da pior sequência de derrotas consecutivas do CSA",
    color: "text-red-600",
  },
};

export default function StreakDetailPage({ type }: { type: StreakDetailType }) {
  const meta = META[type];
  const { data, isLoading, isError } = useGetStreakDetail(type);

  return (
    <RecordsLayout title={meta.title} subtitle={meta.subtitle}>
      <div className="mb-4">
        <Link
          href="/registros/sequencias"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Voltar para Sequências
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Sequência não encontrada.</p>
      ) : (
        <div className="space-y-5">
          <div className="border rounded p-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`text-4xl font-black ${meta.color}`}>
                {data.length}
                <span className="text-base font-normal text-muted-foreground ml-2">jogos</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
            </div>
            <div className="text-sm text-right space-y-1">
              <p className="text-muted-foreground">
                {fmtDate(data.startDate)} — {fmtDate(data.endDate)}
              </p>
              <p>
                <span className="text-muted-foreground">Gols marcados:</span>{" "}
                <span className="font-bold text-green-600">{data.goalsFor}</span>
                <span className="text-muted-foreground mx-2">·</span>
                <span className="text-muted-foreground">Gols sofridos:</span>{" "}
                <span className="font-bold text-red-600">{data.goalsAgainst}</span>
              </p>
            </div>
          </div>

          <div className="border rounded overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 w-8">#</TableHead>
                  <TableHead className="py-2">Data</TableHead>
                  <TableHead className="py-2">Adversário</TableHead>
                  <TableHead className="py-2 text-center">Res.</TableHead>
                  <TableHead className="py-2 text-center">Placar</TableHead>
                  <TableHead className="py-2 hidden sm:table-cell">Competição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.matches.map((m, i) => {
                  const isUnknown = m.result === "unknown";
                  return (
                    <TableRow key={m.id} className="text-sm">
                      <TableCell className="py-2 text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(m.date)}
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <OpponentHistoryLink
                            opponentId={m.opponentId}
                            name={m.opponent}
                            logoUrl={m.opponentLogoUrl}
                          />
                          <span
                            className={cn(
                              "text-xs px-1 py-0.5 rounded",
                              m.homeAway === "home"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {m.homeAway === "home" ? "Casa" : "Fora"}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {isUnknown ? (
                          <span className="text-xs text-muted-foreground">❓</span>
                        ) : (
                          <ResultBadge result={m.result} />
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {isUnknown ? (
                          <span className="font-mono font-bold">❓</span>
                        ) : (
                          <MatchScoreLink matchId={m.id}>
                            {m.goalsFor}–{m.goalsAgainst}
                          </MatchScoreLink>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">
                        {m.competition}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </RecordsLayout>
  );
}
