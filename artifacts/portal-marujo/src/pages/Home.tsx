import { Link } from "wouter";
import {
  useGetSummary,
  useGetTopScorers,
  useGetTopAppearances,
  useListSeasons,
  useGetBiggestVictories,
  useGetStreaks,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function pct(wins: number, total: number) {
  if (!total) return "0.0%";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function Home() {
  const { data: summary, isLoading: loadSum } = useGetSummary();
  const { data: topScorers, isLoading: loadSc } = useGetTopScorers({ limit: 10 });
  const { data: topAppearances, isLoading: loadAp } = useGetTopAppearances({ limit: 10 });
  const { data: seasons, isLoading: loadSe } = useListSeasons();
  const { data: victories } = useGetBiggestVictories({ limit: 3 });
  const { data: streaks } = useGetStreaks();

  const biggestWin = victories?.[0];
  const unbeatenStreak = streaks?.find((s) => s.type === "unbeaten");
  const winStreak = streaks?.find((s) => s.type === "winning");

  return (
    <div className="space-y-6">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold text-foreground" data-testid="heading-visao-geral">Portal Marujo — Base de dados do CSA</h1>
        <p className="text-sm text-muted-foreground">O Portal Marujo está em constante atualização. Temporadas, partidas e estatísticas históricas são adicionadas gradualmente após pesquisa e validação. Os rankings de artilheiros históricos e de jogadores com mais partidas apresentam os valores mínimos comprovados até o momento. Esses números poderão ser atualizados à medida que novas temporadas forem adicionadas e validadas.</p>
      </div>
      {/* Stat bar */}
      {loadSum ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-border rounded overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-background p-3">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-border rounded overflow-hidden text-sm" data-testid="stat-bar">
          {[
            { label: "Partidas", value: summary.totalMatches },
            { label: "Vitórias", value: summary.wins, color: "text-green-600" },
            { label: "Empates", value: summary.draws, color: "text-amber-600" },
            { label: "Derrotas", value: summary.losses, color: "text-red-600" },
            { label: "Gols Marcados", value: summary.goalsScored },
            { label: "Aproveitamento", value: `${summary.winPercentage.toFixed(1)}%`, color: "text-primary font-bold" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-background p-3" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${color ?? ""}`}>{value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Scorers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Artilheiros Históricos</h2>
            <Link href="/jogadores/artilheiros" className="text-xs text-primary hover:underline">ver todos</Link>
          </div>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 w-6">#</TableHead>
                  <TableHead className="py-2">Jogador</TableHead>
                  <TableHead className="py-2 text-right">Gols</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadSc
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-4" /></TableCell>
                      </TableRow>
                    ))
                  : topScorers?.slice(0, 10).map((p, i) => (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline" data-testid={`link-player-${p.id}`}>
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">{p.goals}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Top Appearances */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mais Jogos</h2>
            <Link href="/jogadores/presencas" className="text-xs text-primary hover:underline">ver todos</Link>
          </div>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 w-6">#</TableHead>
                  <TableHead className="py-2">Jogador</TableHead>
                  <TableHead className="py-2 text-right">Jogos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadAp
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-4" /></TableCell>
                      </TableRow>
                    ))
                  : topAppearances?.slice(0, 10).map((p, i) => (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline">
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">{p.appearances}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Season results */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resultados por Temporada</h2>
            <Link href="/temporadas" className="text-xs text-primary hover:underline">ver todos</Link>
          </div>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Ano</TableHead>
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right text-green-600">V</TableHead>
                  <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                  <TableHead className="py-2 text-right text-red-600">D</TableHead>
                  <TableHead className="py-2 text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadSe
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-4" /></TableCell>
                      </TableRow>
                    ))
                  : seasons?.slice(0, 10).map((s) => (
                      <TableRow key={s.year} className="text-sm">
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/temporadas/${s.year}`} className="hover:text-primary hover:underline" data-testid={`link-season-${s.year}`}>
                            {s.year}
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right">{s.matches}</TableCell>
                        <TableCell className="py-1.5 text-right text-green-600 font-medium">{s.wins}</TableCell>
                        <TableCell className="py-1.5 text-right text-amber-600">{s.draws}</TableCell>
                        <TableCell className="py-1.5 text-right text-red-600">{s.losses}</TableCell>
                        <TableCell className="py-1.5 text-right font-medium">{pct(s.wins, s.matches)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {/* Records highlights */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recordes Históricos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summary && (
            <div className="border rounded p-4 space-y-1" data-testid="record-top-scorer">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Artilheiro</p>
              <p className="font-bold text-base">{summary.topScorer.name}</p>
              <p className="text-2xl font-black text-primary">{summary.topScorer.goals} <span className="text-sm font-normal text-muted-foreground">gols</span></p>
            </div>
          )}
          {summary && (
            <div className="border rounded p-4 space-y-1" data-testid="record-top-appearances">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Mais Partidas</p>
              <p className="font-bold text-base">{summary.appearanceLeader.name}</p>
              <p className="text-2xl font-black text-primary">{summary.appearanceLeader.appearances} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
            </div>
          )}
          {biggestWin && (
            <div className="border rounded p-4 space-y-1" data-testid="record-biggest-win">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Vitória</p>
              <p className="font-bold text-base">{biggestWin.opponent}</p>
              <p className="text-2xl font-black text-green-600">{biggestWin.goalsFor}–{biggestWin.goalsAgainst} <span className="text-sm font-normal text-muted-foreground">{fmtDate(biggestWin.date)}</span></p>
            </div>
          )}
          {unbeatenStreak && (
            <div className="border rounded p-4 space-y-1" data-testid="record-unbeaten">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Invencibilidade</p>
              <p className="font-bold text-base">Sequência invicta</p>
              <p className="text-2xl font-black text-primary">{unbeatenStreak.length} <span className="text-sm font-normal text-muted-foreground">jogos</span></p>
            </div>
          )}
        </div>
      </div>
      {/* Most common opponents */}
      {summary && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Adversários Mais Frequentes</h2>
            <Link href="/adversarios" className="text-xs text-primary hover:underline">ver todos</Link>
          </div>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 w-6">#</TableHead>
                  <TableHead className="py-2">Adversário</TableHead>
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right text-green-600">V</TableHead>
                  <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                  <TableHead className="py-2 text-right text-red-600">D</TableHead>
                  <TableHead className="py-2 text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.mostCommonOpponents.map((opp, i) => (
                  <TableRow key={opp.id} className="text-sm">
                    <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="py-1.5 font-medium">
                      <Link href={`/adversarios/${opp.id}`} className="hover:text-primary hover:underline" data-testid={`link-opponent-${opp.id}`}>
                        {opp.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-1.5 text-right">{opp.matches}</TableCell>
                    <TableCell className="py-1.5 text-right text-green-600">{opp.wins}</TableCell>
                    <TableCell className="py-1.5 text-right text-amber-600">{opp.draws}</TableCell>
                    <TableCell className="py-1.5 text-right text-red-600">{opp.losses}</TableCell>
                    <TableCell className="py-1.5 text-right font-medium">{pct(opp.wins, opp.matches)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
