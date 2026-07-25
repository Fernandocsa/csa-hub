import { Link } from "wouter";
import {
  useGetSummary,
  useGetTopScorers,
  useGetTopAppearances,
  useListSeasons,
  useGetBiggestVictories,
  useGetStreaks,
  useGetMatchMilestones,
  useGetBiggestAttendance,
  useGetTopAssists,
  type MilestoneMatch,
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
import { VerifiedBadge } from "@/components/VerifiedBadge";

function pct(wins: number, total: number) {
  if (!total) return "0.0%";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

const resultColor: Record<string, string> = {
  win:  "text-green-600",
  draw: "text-amber-600",
  loss: "text-red-600",
};

function MilestoneCard({ label, match }: { label: string; match: MilestoneMatch }) {
  const isHome = match.homeAway === "home";
  const home = isHome ? "CSA" : match.opponent;
  const away = isHome ? match.opponent : "CSA";
  const scoreColor = resultColor[match.result] ?? "text-foreground";

  return (
    <div className="border rounded p-4 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <div>
        <p className="text-xs text-muted-foreground">{fmtDate(match.date)} · {match.competition}</p>
        <p className="font-semibold text-sm mt-0.5 truncate">{home} × {away}</p>
      </div>
      <p className={`text-2xl font-black ${scoreColor}`}>
        {isHome ? match.goalsFor : match.goalsAgainst}
        <span className="text-muted-foreground font-normal text-lg mx-1">–</span>
        {isHome ? match.goalsAgainst : match.goalsFor}
      </p>
      <p className="text-xs text-muted-foreground">{match.season}</p>
    </div>
  );
}

// Static for now — replace with DB data when available
const NEXT_MATCH = {
  home: "CSA",
  away: "São Luiz de Ijuí-RS",
  date: "2026-07-26",
  competition: "Campeonato Brasileiro Série D",
};

function NextMatchCard() {
  return (
    <div className="border rounded p-4 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Próxima Partida</p>
      <div>
        <p className="text-xs text-muted-foreground">{fmtDate(NEXT_MATCH.date)} · {NEXT_MATCH.competition}</p>
        <p className="font-semibold text-sm mt-0.5 truncate">{NEXT_MATCH.home} × {NEXT_MATCH.away}</p>
      </div>
      <p className="text-2xl font-black text-muted-foreground">
        –<span className="text-muted-foreground font-normal text-lg mx-1">×</span>–
      </p>
      <p className="text-xs text-muted-foreground">{new Date(NEXT_MATCH.date + "T12:00:00").getFullYear()}</p>
    </div>
  );
}

export default function Home() {
  const { data: summary, isLoading: loadSum } = useGetSummary();
  const { data: topScorers, isLoading: loadSc } = useGetTopScorers({ limit: 10 });
  const { data: topAppearances, isLoading: loadAp } = useGetTopAppearances({ limit: 10 });
  const { data: seasons, isLoading: loadSe } = useListSeasons();
  const { data: victories } = useGetBiggestVictories({ limit: 3 });
  const { data: streaks } = useGetStreaks();
  const { data: milestones, isLoading: loadMil } = useGetMatchMilestones();
  const { data: biggestAttendance, isLoading: loadAtt } = useGetBiggestAttendance(10);
  const { data: topAssists, isLoading: loadAsst } = useGetTopAssists(10);

  const biggestWin = victories?.[0];
  const unbeatenStreak = streaks?.find((s) => s.type === "unbeaten");
  const winStreak = streaks?.find((s) => s.type === "winning");

  return (
    <div className="space-y-6">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold text-foreground" data-testid="heading-visao-geral">Portal Marujo — Base de dados do CSA</h1>
        <p className="text-sm text-muted-foreground">O Portal Marujo está em constante atualização. O principal objetivo do projeto é catalogar todos os jogos oficiais da história do CSA. Após a conclusão dessa etapa, o foco passa a ser a validação completa das estatísticas individuais dos jogadores e, posteriormente, a inclusão dos públicos e rendas das partidas.</p>
        <p className="text-sm text-muted-foreground mt-1">Os jogadores identificados com o selo de verificação (✓) possuem suas estatísticas totalmente conferidas e validadas. Já os demais atletas podem ter seus números ampliados à medida que novas temporadas forem pesquisadas e adicionadas ao acervo.</p>
        <p className="text-sm text-muted-foreground mt-1">Os rankings históricos exibem os valores mínimos comprovados até o momento e serão atualizados continuamente conforme novas informações forem verificadas.</p>
      </div>
      {/* Stat bar */}
      {loadSum ? (
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-px bg-border rounded overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-background p-3">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-px bg-border rounded overflow-hidden text-sm" data-testid="stat-bar">
          {[
            { label: "Partidas", value: summary.totalMatches },
            { label: "Vitórias", value: summary.wins, color: "text-green-600" },
            { label: "Empates", value: summary.draws, color: "text-amber-600" },
            { label: "Derrotas", value: summary.losses, color: "text-red-600" },
            { label: "Gols Marcados", value: summary.goalsScored },
            { label: "Gols Sofridos", value: summary.goalsConceded },
            { label: "Aproveitamento", value: `${summary.winPercentage.toFixed(1)}%`, color: "text-primary font-bold" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-background p-3" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${color ?? ""}`}>{value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {/* Primeira e Última Partida */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Marcos Históricos</h2>
          <span className="text-xs text-muted-foreground/70 italic">As estatísticas de partidas consideram apenas jogos oficiais.</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loadMil ? (
            <>
              <div className="border rounded p-4 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="border rounded p-4 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="border rounded p-4 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </>
          ) : (
            <>
              {milestones?.first && <MilestoneCard label="Primeira Partida" match={milestones.first} />}
              {milestones?.last  && <MilestoneCard label="Última Partida"   match={milestones.last}  />}
              <NextMatchCard />
            </>
          )}
        </div>
      </div>
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
                  : topScorers?.slice(0, 10).map((p, i) => {
                      const flag = (p as any).nationalityFlag as string | null | undefined;
                      return (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1" data-testid={`link-player-${p.id}`}>
                            {flag && (
                              <span className="mr-0.5 text-base leading-none">{flag}</span>
                            )}
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">{p.goals}</TableCell>
                      </TableRow>
                      );
                    })}
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
                  : topAppearances?.slice(0, 10).map((p, i) => {
                      const flag = (p as any).nationalityFlag as string | null | undefined;
                      return (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                            {flag && (
                              <span className="mr-0.5 text-base leading-none">{flag}</span>
                            )}
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">{p.appearances}</TableCell>
                      </TableRow>
                      );
                    })}
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
      {/* Maiores Públicos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Maiores Públicos</h2>
          <Link href="/publicos" className="text-xs text-primary hover:underline">ver ranking completo</Link>
        </div>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2 w-6">#</TableHead>
                <TableHead className="py-2">Partida</TableHead>
                <TableHead className="py-2 text-right font-bold text-primary">Público</TableHead>
                <TableHead className="py-2 text-right hidden sm:table-cell">Pagante</TableHead>
                <TableHead className="py-2 text-right hidden md:table-cell">Renda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadAtt
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-4" /></TableCell>
                    </TableRow>
                  ))
                : biggestAttendance?.slice(0, 10).map((m, i) => {
                    const isHome = m.homeAway === "home";
                    const home = isHome ? "CSA" : m.opponent;
                    const away = isHome ? m.opponent : "CSA";
                    return (
                      <TableRow key={m.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          {home} {m.goalsFor}–{m.goalsAgainst} {away}
                          <span className="ml-1.5 text-xs text-muted-foreground">({m.season})</span>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">
                          {m.attendance.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="py-1.5 text-right text-muted-foreground hidden sm:table-cell">
                          {m.attendancePaid != null ? m.attendancePaid.toLocaleString("pt-BR") : <span className="text-xs">—</span>}
                        </TableCell>
                        <TableCell className="py-1.5 text-right text-muted-foreground hidden md:table-cell">
                          {(m as any).grossRevenueText
                            ? (m as any).grossRevenueText
                            : m.grossRevenue != null
                              ? m.grossRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                              : <span className="text-xs">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mais Assistências */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mais Assistências</h2>
          <Link href="/jogadores/assistencias" className="text-xs text-primary hover:underline">ver ranking completo</Link>
        </div>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2 w-6">#</TableHead>
                <TableHead className="py-2">Jogador</TableHead>
                <TableHead className="py-2 text-right font-bold text-primary">Assistências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadAsst
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}><Skeleton className="h-4" /></TableCell>
                    </TableRow>
                  ))
                : topAssists?.slice(0, 10).map((p, i) => {
                    const flag = (p as any).nationalityFlag as string | null | undefined;
                    return (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                            {flag && p.nationality !== "Brasil" && (
                              <span className="mr-0.5 text-base leading-none">{flag}</span>
                            )}
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">{p.assists}</TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
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
