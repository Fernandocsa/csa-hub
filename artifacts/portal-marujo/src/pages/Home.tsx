import { Link } from "wouter";
import {
  Users,
  Swords,
  CalendarDays,
  Shield,
  Trophy,
  Award,
} from "lucide-react";
import {
  useGetSummary,
  useGetTopScorers,
  useGetTopAppearances,
  useListSeasons,
  useGetBiggestVictories,
  useGetStreaks,
  useGetTitles,
  useGetMatchMilestones,
  useGetTopAssists,
  useGetNextMatch,
  useGetBirthdaysToday,
  useGetOnThisDay,
  useGetLatestTransfer,
  type MilestoneMatch,
  type BirthdayPerson,
  type OnThisDayMatch,
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
import { MatchSidesLabel } from "@/components/MatchSidesLabel";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";
import { PlayerFlag } from "@/components/PlayerFlag";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { EntityPhoto } from "@/components/EntityPhoto";
import { ShareButton } from "@/components/ShareButton";
import { GlobalSearch } from "@/components/GlobalSearch";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";
import { formatInt, formatDateBr } from "@/lib/utils";

function fmtDate(d: string) {
  return formatDateBr(d);
}

const resultColor: Record<string, string> = {
  win:  "text-green-600",
  draw: "text-amber-600",
  loss: "text-red-600",
};

function MilestoneCard({ label, match }: { label: string; match: MilestoneMatch }) {
  const isHome = match.homeAway === "home";
  const scoreColor = resultColor[match.result] ?? "text-foreground";
  const opponentId = (match as { opponentId?: number }).opponentId;

  return (
    <div
      className="border rounded p-4 space-y-2"
      data-testid={`link-milestone-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <div>
        <p className="text-xs text-muted-foreground">{fmtDate(match.date)} · {match.competition}</p>
        <p className="font-semibold text-sm mt-0.5">
          <MatchSidesLabel
            homeAway={match.homeAway}
            opponent={match.opponent}
            opponentId={opponentId}
            logoUrl={match.opponentLogoUrl}
          />
        </p>
      </div>
      <p className={`text-2xl font-black ${scoreColor}`}>
        <MatchScoreLink matchId={match.id} className={scoreColor}>
          {isHome ? match.goalsFor : match.goalsAgainst}
          <span className="text-muted-foreground font-normal text-lg mx-1">–</span>
          {isHome ? match.goalsAgainst : match.goalsFor}
        </MatchScoreLink>
      </p>
      <p className="text-xs text-muted-foreground">{match.season}</p>
    </div>
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
        <p className="text-sm font-medium text-muted-foreground">Aguardando</p>
      </div>
    );
  }

  const isHome = nextMatch.homeAway === "home";
  const year = Number(String(nextMatch.matchDate).slice(0, 4));
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
      <p className="text-sm font-semibold text-primary/80 tracking-wide">Aguardando</p>
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

function BirthdayPersonLink({ person }: { person: BirthdayPerson }) {
  const href =
    person.kind === "manager" ? `/tecnicos/${person.id}` : `/jogadores/${person.id}`;
  const role =
    person.kind === "manager" ? "Técnico" : person.position ?? "Jogador";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-1 py-1.5 -mx-1 hover:bg-muted/50 group"
      data-testid={`birthday-${person.kind}-${person.id}`}
    >
      {person.kind === "player" ? (
        <PlayerPhoto url={person.photoUrl} name={person.name} size="sm" />
      ) : (
        <EntityPhoto url={person.photoUrl} name={person.name} size="sm" shape="circle" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <PlayerFlag
            flag={person.nationalityFlag}
            nationality={person.nationality}
            size="sm"
          />
          <span className="font-medium text-sm truncate group-hover:text-primary">
            {person.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {role}
          {person.age != null ? ` · ${person.age} anos` : ""}
        </p>
      </div>
    </Link>
  );
}

function yearsAgoLabel(yearsAgo: number | null) {
  if (yearsAgo == null || yearsAgo < 0) return null;
  if (yearsAgo === 0) return "Neste ano";
  if (yearsAgo === 1) return "Há 1 ano";
  return `Há ${yearsAgo} anos`;
}

function formatDayMonth(month: number, day: number) {
  return new Date(Date.UTC(2000, month - 1, day, 15, 0, 0)).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
  });
}

function OnThisDayMatchRow({ match }: { match: OnThisDayMatch }) {
  const ago = yearsAgoLabel(match.yearsAgo);
  const scoreReady = match.goalsFor != null && match.goalsAgainst != null;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2"
      data-testid={`on-this-day-match-${match.id}`}
    >
      <div className="sm:w-28 shrink-0">
        <p className="text-xs font-semibold text-primary">
          {ago ?? match.season}
        </p>
        <p className="text-[11px] text-muted-foreground">{fmtDate(match.date)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">
          <MatchSidesLabel
            homeAway={match.homeAway}
            opponent={match.opponent}
            opponentId={match.opponentId}
            matchId={match.id}
            logoUrl={match.opponentLogoUrl}
            separator={
              scoreReady ? `${match.goalsFor}–${match.goalsAgainst}` : "×"
            }
          />
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {match.competition}
          {match.stadium ? ` · ${match.stadium}` : ""}
        </p>
      </div>
    </div>
  );
}

function OnThisDaySection() {
  const { data, isLoading } = useGetOnThisDay();
  const matches = data?.matches ?? [];

  if (!isLoading && matches.length === 0) return null;

  const titleDate =
    data != null ? formatDayMonth(data.month, data.day) : null;

  return (
    <section
      className="space-y-3 rounded-lg border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-4"
      data-testid="section-on-this-day"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 className="text-base font-bold tracking-tight text-primary">
          Neste dia
        </h2>
        {titleDate && (
          <span className="text-sm font-medium text-foreground/80">{titleDate}</span>
        )}
        <span className="text-xs text-muted-foreground italic">
          Jogos oficiais do CSA nesta data, em outros anos
        </span>
      </div>
      {isLoading ? (
        <div className="rounded-md border bg-background/80 p-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-24 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="rounded-md border bg-background/80 p-3 divide-y divide-border/60">
          {matches.map((m) => (
            <li key={m.id}>
              <OnThisDayMatchRow match={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BirthdaysTodaySection() {
  const { data, isLoading } = useGetBirthdaysToday();
  const people = [...(data?.players ?? []), ...(data?.managers ?? [])];

  if (!isLoading && people.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="section-birthdays-today">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Aniversariantes do dia
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 border rounded p-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border rounded p-3">
          {people.map((p) => (
            <li key={`${p.kind}-${p.id}`}>
              <BirthdayPersonLink person={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LatestTransferSection() {
  const { data, isLoading } = useGetLatestTransfer();

  if (isLoading || !data) return null;

  const club = data.club?.trim();

  return (
    <section data-testid="section-latest-transfer">
      <div className="flex items-center gap-3 border rounded p-4 hover:bg-muted/40 transition-colors group">
        <Link href="/transferencias" className="shrink-0" aria-label={data.playerName}>
          <PlayerPhoto
            url={data.playerPhotoUrl}
            name={data.playerName}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href="/transferencias" className="block">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Última transferência
            </p>
            <p className="text-sm font-semibold group-hover:text-primary">
              {data.playerName}
              {" — "}
              {data.direction === "out" ? "Saída" : "Chegada"}
              {!club ? null : data.direction === "out" ? " → " : " ← "}
            </p>
          </Link>
          {club && (
            <div className="mt-0.5">
              <OpponentHistoryLink
                opponentId={data.opponentId}
                name={club}
                logoUrl={data.clubLogoUrl}
                crestAfter={false}
                crestFallback
              />
            </div>
          )}
          {(data.transferDate || data.season) && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.transferDate ? fmtDate(data.transferDate) : null}
              {data.transferDate && data.season ? " · " : null}
              {data.season ? `Temporada ${data.season}` : null}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: summary, isLoading: loadSum } = useGetSummary();
  const { data: topScorers, isLoading: loadSc } = useGetTopScorers({ limit: 10 });
  const { data: topAppearances, isLoading: loadAp } = useGetTopAppearances({ limit: 10 });
  const { data: seasons } = useListSeasons();
  const { data: victories } = useGetBiggestVictories({ limit: 3 });
  const { data: streaks } = useGetStreaks();
  const { data: titles } = useGetTitles();
  const { data: milestones, isLoading: loadMil } = useGetMatchMilestones();
  const { data: topAssists, isLoading: loadAsst } = useGetTopAssists({ limit: 10 });

  const victoryList = Array.isArray(victories) ? victories : [];
  const streakList = Array.isArray(streaks) ? streaks : [];
  const scorerList = Array.isArray(topScorers) ? topScorers : [];
  const appearanceList = Array.isArray(topAppearances) ? topAppearances : [];
  const seasonList = Array.isArray(seasons) ? seasons : [];
  const assistList = Array.isArray(topAssists) ? topAssists : [];

  const homeScorers = scorerList.slice(0, 10);
  const homeScorerRanks = assignCompetitionRanks(homeScorers, (p) => p.goals);
  const homeAppearances = appearanceList.slice(0, 10);
  const homeAppearanceRanks = assignCompetitionRanks(homeAppearances, (p) => p.appearances);
  const homeAssists = assistList.slice(0, 10);
  const homeAssistRanks = assignCompetitionRanks(homeAssists, (p) => p.assists);

  const biggestWin = victoryList[0];
  const unbeatenStreak = streakList.find((s) => s.type === "unbeaten");
  const winStreak = streakList.find((s) => s.type === "winning");

  const shortcuts = [
    { href: "/jogadores", label: "Jogadores", icon: Users, count: null as string | null },
    {
      href: "/partidas",
      label: "Partidas",
      icon: Swords,
      count: summary ? formatInt(summary.totalMatches) : null,
    },
    {
      href: "/temporadas",
      label: "Temporadas",
      icon: CalendarDays,
      count: seasonList.length ? formatInt(seasonList.length) : null,
    },
    {
      href: "/adversarios",
      label: "Adversários",
      icon: Shield,
      count: null,
    },
    { href: "/tecnicos", label: "Técnicos", icon: Trophy, count: null },
    {
      href: "/registros",
      label: "Recordes",
      icon: Award,
      count: titles ? formatInt(titles.total) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-5 space-y-4">
        <div className="border-b border-primary/10 pb-3">
          <div className="inline-flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="heading-visao-geral">
              Portal Marujo — Base de dados do CSA
            </h1>
            <ShareButton title="Portal Marujo — Base de dados do CSA" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            O Portal Marujo está em constante atualização. O principal objetivo do projeto é catalogar todos os jogos oficiais da história do CSA. Após a conclusão dessa etapa, o foco passa a ser a validação completa das estatísticas individuais dos jogadores e, posteriormente, a inclusão dos públicos e rendas das partidas.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Os jogadores identificados com o selo de verificação (✓) possuem suas estatísticas totalmente conferidas e validadas. Já os demais atletas podem ter seus números ampliados à medida que novas temporadas forem pesquisadas e adicionadas ao acervo.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Os rankings históricos exibem os valores mínimos comprovados até o momento e serão atualizados continuamente conforme novas informações forem verificadas.
          </p>
          <p className="text-sm mt-2">
            <Link
              href="/contribua"
              className="text-primary hover:underline font-medium"
              data-testid="link-contribua-home"
            >
              Ajude a completar o acervo →
            </Link>
          </p>
        </div>

        <GlobalSearch />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" data-testid="home-shortcuts">
          {shortcuts.map(({ href, label, icon: Icon, count }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-start gap-2 rounded-md border bg-background/80 px-3 py-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              data-testid={`shortcut-${label.toLowerCase()}`}
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold leading-tight group-hover:text-primary">
                {label}
              </span>
              {count != null && (
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Stat bar */}
        {loadSum ? (
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-px bg-primary/20 rounded overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-background/90 p-3">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : summary ? (
          <div
            className="grid grid-cols-3 sm:grid-cols-7 gap-px bg-primary/25 rounded overflow-hidden text-sm shadow-sm"
            data-testid="stat-bar"
          >
            {[
              { label: "Partidas", value: formatInt(summary.totalMatches) },
              { label: "Vitórias", value: formatInt(summary.wins), color: "text-green-600" },
              { label: "Empates", value: formatInt(summary.draws), color: "text-amber-600" },
              { label: "Derrotas", value: formatInt(summary.losses), color: "text-red-600" },
              { label: "Gols Marcados", value: formatInt(summary.goalsScored) },
              { label: "Gols Sofridos", value: formatInt(summary.goalsConceded) },
              {
                label: "Aproveitamento",
                value: `${(summary.winPercentage ?? 0).toFixed(1)}%`,
                color: "text-primary font-bold",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-background p-3"
                data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">
                  {label}
                </p>
                <p className={`text-lg font-bold mt-0.5 tabular-nums ${color ?? ""}`}>{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Marcos Históricos */}
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

      <LatestTransferSection />
      <OnThisDaySection />
      <BirthdaysTodaySection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mais Jogos */}
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
                              showBrazil={false}
                            />
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary tabular-nums">{formatInt(p.appearances)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Artilheiros */}
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
                              showBrazil={false}
                            />
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary tabular-nums">{formatInt(p.goals)}</TableCell>
                      </TableRow>
                    ))}
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
                  ? Array.from({ length: 8 }).map((_, i) => (
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
                              showBrazil={false}
                            />
                            {p.name}
                            <VerifiedBadge status={(p as any).verificationStatus} />
                          </Link>
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-bold text-primary tabular-nums">{formatInt(p.assists)}</TableCell>
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
                {formatInt(titles.total)}{" "}
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
                {formatInt(winStreak.length)}{" "}
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
                {formatInt(unbeatenStreak.length)}{" "}
                <span className="text-sm font-normal text-muted-foreground">jogos</span>
              </p>
            </Link>
          )}
          {biggestWin && (
            <div
              className="border rounded p-4 space-y-1"
              data-testid="record-biggest-win"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Maior Vitória</p>
              <p className="font-bold text-base">
                <OpponentHistoryLink
                  opponentId={(biggestWin as { opponentId?: number }).opponentId}
                  name={biggestWin.opponent}
                  logoUrl={biggestWin.opponentLogoUrl}
                />
              </p>
              <p className="text-2xl font-black text-green-600">
                <MatchScoreLink matchId={biggestWin.id} className="text-green-600">
                  {biggestWin.goalsFor}–{biggestWin.goalsAgainst}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {fmtDate(biggestWin.date)}
                  </span>
                </MatchScoreLink>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

