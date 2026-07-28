import { Link } from "wouter";
import {
  useGetSummary,
  useGetTopScorers,
  useGetTopAppearances,
  useListSeasons,
  useGetBiggestVictories,
  useGetStreaks,
  useGetTitles,
  useGetMatchMilestones,
  useGetBiggestAttendance,
  useGetTopAssists,
  useGetNextMatch,
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
import { OpponentCrest } from "@/components/OpponentCrest";
import { MatchSidesLabel } from "@/components/MatchSidesLabel";
import { PlayerFlag } from "@/components/PlayerFlag";
import { ShareButton } from "@/components/ShareButton";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

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
  const scoreColor = resultColor[match.result] ?? "text-foreground";

  return (
    <Link
      href={`/partidas/${match.id}`}
      className="border rounded p-4 space-y-2 block hover:bg-muted/40 transition-colors"
      data-testid={`link-milestone-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <div>
        <p className="text-xs text-muted-foreground">{fmtDate(match.date)} · {match.competition}</p>
        <p className="font-semibold text-sm mt-0.5">
          <MatchSidesLabel
            homeAway={match.homeAway}
            opponent={match.opponent}
            logoUrl={match.opponentLogoUrl}
          />
        </p>
      </div>
      <p className={`text-2xl font-black ${scoreColor}`}>
        {isHome ? match.goalsFor : match.goalsAgainst}
        <span className="text-muted-foreground font-normal text-lg mx-1">–</span>
        {isHome ? match.goalsAgainst : match.goalsFor}
      </p>
      <p className="text-xs text-muted-foreground">{match.season}</p>
    </Link>
  );
}

function NextMatchCard() {
  const { data: nextMatch, isLoading } = useGetNextMatch();

  if (isLoading) {
    return (
      <div className="border rounded p-4 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  if (!nextMatch) {
    return (
      <div className="border rounded p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Próxima Partida</p>
        <p className="font-semibold text-sm mt-0.5 text-muted-foreground">A definir</p>
        <p className="text-2xl font-black text-muted-foreground">
          –<span className="text-muted-foreground font-normal text-lg mx-1">×</span>–
        </p>
      </div>
    );
  }

  const isHome = nextMatch.homeAway === "home";
  const year = new Date(nextMatch.matchDate + "T12:00:00").getFullYear();
  const href =
    nextMatch.matchId != null
      ? `/partidas/${nextMatch.matchId}`
      : nextMatch.opponentId != null
        ? `/adversarios/${nextMatch.opponentId}`
        : null;

  const body = (
    <>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Próxima Partida</p>
      <div>
        <p className="text-xs text-muted-foreground">
          {fmtDate(nextMatch.matchDate)} · {nextMatch.competition}
          {nextMatch.stadium ? ` · ${nextMatch.stadium}` : ""}
        </p>
        <p className="font-semibold text-sm mt-0.5">
          <MatchSidesLabel
            homeAway={isHome ? "home" : "away"}
            opponent={nextMatch.opponent}
            logoUrl={nextMatch.opponentLogoUrl}
          />
        </p>
      </div>
      <p className="text-2xl font-black text-muted-foreground">
        –<span className="text-muted-foreground font-normal text-lg mx-1">×</span>–
      </p>
      <p className="text-xs text-muted-foreground">{year}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="border rounded p-4 space-y-2 block hover:bg-muted/40 transition-colors"
        data-testid="link-next-match"
      >
        {body}
      </Link>
    );
  }

  return <div className="border rounded p-4 space-y-2">{body}</div>;
}

export default function Home() {
  const { data: summary, isLoading: loadSum } = useGetSummary();
  const { data: topScorers, isLoading: loadSc } = useGetTopScorers({ limit: 10 });
  const { data: topAppearances, isLoading: loadAp } = useGetTopAppearances({ limit: 10 });
  const { data: seasons, isLoading: loadSe } = useListSeasons();
  const { data: victories } = useGetBiggestVictories({ limit: 3 });
  const { data: streaks } = useGetStreaks();
  const { data: titles } = useGetTitles();
  const { data: milestones, isLoading: loadMil } = useGetMatchMilestones();
  const { data: biggestAttendance, isLoading: loadAtt } = useGetBiggestAttendance(10);
  const { data: topAssists, isLoading: loadAsst } = useGetTopAssists(10);

  const victoryList = Array.isArray(victories) ? victories : [];
  const streakList = Array.isArray(streaks) ? streaks : [];
  const scorerList = Array.isArray(topScorers) ? topScorers : [];
  const appearanceList = Array.isArray(topAppearances) ? topAppearances : [];
  const seasonList = Array.isArray(seasons) ? seasons : [];
  const attendanceList = Array.isArray(biggestAttendance) ? biggestAttendance : [];
  const assistList = Array.isArray(topAssists) ? topAssists : [];
  const opponentList = Array.isArray(summary?.mostCommonOpponents)
    ? summary.mostCommonOpponents
    : [];

  const homeScorers = scorerList.slice(0, 10);
  const homeScorerRanks = assignCompetitionRanks(homeScorers, (p) => p.goals);
  const homeAppearances = appearanceList.slice(0, 10);
  const homeAppearanceRanks = assignCompetitionRanks(homeAppearances, (p) => p.appearances);
  const homeAttendance = attendanceList.slice(0, 10);
  const homeAttendanceRanks = assignCompetitionRanks(homeAttendance, (m) => m.attendance);
  const homeAssists = assistList.slice(0, 10);
  const homeAssistRanks = assignCompetitionRanks(homeAssists, (p) => p.assists);
  const homeOpponentRanks = assignCompetitionRanks(opponentList, (o) => o.matches);

  const biggestWin = victoryList[0];
  const unbeatenStreak = streakList.find((s) => s.type === "unbeaten");
  const winStreak = streakList.find((s) => s.type === "winning");

  return (
    <div className="space-y-6">
      <div className="border-b pb-3">
        <div className="inline-flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground" data-testid="heading-visao-geral">Portal Marujo — Base de dados do CSA</h1>
          <ShareButton title="Portal Marujo — Base de dados do CSA" />
        </div>
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
            { label: "Aproveitamento", value: `${(summary.winPercentage ?? 0).toFixed(1)}%`, color: "text-primary font-bold" },
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
                  : homeScorers.map((p, i) => (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{formatCompetitionRank(homeScorerRanks[i])}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1" data-testid={`link-player-${p.id}`}>
                            <PlayerFlag
                              flag={(p as { nationalityFlag?: string | null }).nationalityFlag}
                              nationality={p.nationality}
                            />
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
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
                  : homeAppearances.map((p, i) => (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{formatCompetitionRank(homeAppearanceRanks[i])}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                            <PlayerFlag
                              flag={(p as { nationalityFlag?: string | null }).nationalityFlag}
                              nationality={p.nationality}
                            />
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
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
                  : seasonList.slice(0, 10).map((s) => (
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
          {titles && (
            <Link
              href="/titulos"
              className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
              data-testid="record-titles"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Títulos</p>
              <p className="font-bold text-base">Campeonatos conquistados</p>
              <p className="text-2xl font-black text-primary">
                {titles.total}{" "}
                <span className="text-sm font-normal text-muted-foreground">títulos</span>
              </p>
            </Link>
          )}
          {winStreak && (
            <Link
              href="/registros/sequencias/vitorias"
              className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
              data-testid="record-win-streak"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Sequência de Vitórias</p>
              <p className="font-bold text-base">Vitórias consecutivas</p>
              <p className="text-2xl font-black text-green-600">
                {winStreak.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">jogos</span>
              </p>
            </Link>
          )}
          {unbeatenStreak && (
            <Link
              href="/registros/sequencias/invencibilidade"
              className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
              data-testid="record-unbeaten"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Invencibilidade</p>
              <p className="font-bold text-base">Sequência invicta</p>
              <p className="text-2xl font-black text-primary">
                {unbeatenStreak.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">jogos</span>
              </p>
            </Link>
          )}
          {biggestWin && (
            <Link
              href={`/partidas/${biggestWin.id}`}
              className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
              data-testid="record-biggest-win"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Vitória</p>
              <p className="font-bold text-base inline-flex items-center gap-2">
                {biggestWin.opponent}
                <OpponentCrest url={biggestWin.opponentLogoUrl} name={biggestWin.opponent} size="sm" />
              </p>
              <p className="text-2xl font-black text-green-600">
                {biggestWin.goalsFor}–{biggestWin.goalsAgainst}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {fmtDate(biggestWin.date)}
                </span>
              </p>
            </Link>
          )}
        </div>
      </div>
      {/* Maiores Públicos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Maiores Públicos</h2>
          <Link href="/publicos" className="text-xs text-primary hover:underline">ver todos</Link>
        </div>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2 w-6">#</TableHead>
                <TableHead className="py-2">Partida</TableHead>
                <TableHead className="py-2 text-right font-bold text-primary">Público</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadAtt
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}><Skeleton className="h-4" /></TableCell>
                    </TableRow>
                  ))
                : homeAttendance.map((m, i) => {
                    return (
                      <TableRow key={m.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{formatCompetitionRank(homeAttendanceRanks[i])}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link
                            href={`/partidas/${m.id}`}
                            className="hover:text-primary hover:underline inline-flex items-center gap-1.5 flex-wrap"
                            data-testid={`link-attendance-match-${m.id}`}
                          >
                            <MatchSidesLabel
                              homeAway={m.homeAway}
                              opponent={m.opponent}
                              logoUrl={m.opponentLogoUrl}
                              separator={`${m.goalsFor}–${m.goalsAgainst}`}
                            />
                            <span className="text-xs text-muted-foreground">({m.season})</span>
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">
                          {m.attendance.toLocaleString("pt-BR")}
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
                : homeAssists.map((p, i) => (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-1.5 text-muted-foreground text-xs">{formatCompetitionRank(homeAssistRanks[i])}</TableCell>
                        <TableCell className="py-1.5 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                            <PlayerFlag
                              flag={(p as { nationalityFlag?: string | null }).nationalityFlag}
                              nationality={p.nationality}
                            />
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary">{p.assists}</TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Most common opponents */}
      {summary && opponentList.length > 0 && (
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
                {opponentList.map((opp, i) => (
                  <TableRow key={opp.id} className="text-sm">
                    <TableCell className="py-1.5 text-muted-foreground text-xs">{formatCompetitionRank(homeOpponentRanks[i])}</TableCell>
                    <TableCell className="py-1.5 font-medium">
                      <Link
                        href={`/adversarios/${opp.id}`}
                        className="inline-flex items-center gap-2 hover:text-primary hover:underline"
                        data-testid={`link-opponent-${opp.id}`}
                      >
                        <OpponentCrest url={opp.logoUrl} name={opp.name} size="sm" />
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
