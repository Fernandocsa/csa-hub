import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  useGetOpponent,
  getGetOpponentQueryKey,
  type OpponentClubStadium,
  type OpponentCompetitionStat,
  type OpponentConfrontationMatch,
  type OpponentHighlightEntry,
  type OpponentHighlights,
  type OpponentManagerHighlightEntry,
  type OpponentManagerHighlights,
  type OpponentMarginMatch,
  type OpponentRelatedSummary,
  type OpponentRepeatedScoreline,
  type OpponentUpcomingMatch,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { ResultBadge, WalkoverBadge } from "@/components/ui/result-badge";
import { Button } from "@/components/ui/button";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { OpponentCrest } from "@/components/OpponentCrest";
import { ShareButton } from "@/components/ShareButton";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";

import { formatDateBr } from "@/lib/utils";
import { countryDisplayName } from "@/lib/countries";
import { ufDisplayName } from "@/lib/br-locations";

const HISTORY_PREVIEW = 10;

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return formatDateBr(d);
}

function MiniRecord({ label, data: d }: { label: string; data: { matches: number; wins: number; draws: number; losses: number } }) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <span className="font-bold">{d.matches}J</span>
        <span className="text-green-600 font-medium">{d.wins}V</span>
        <span className="text-amber-600">{d.draws}E</span>
        <span className="text-red-600">{d.losses}D</span>
        <span className="text-muted-foreground ml-1">{pct(d.wins, d.matches)}</span>
      </div>
    </div>
  );
}

type OpponentCompetitionStatRow = OpponentCompetitionStat & {
  variants?: OpponentCompetitionStat[];
};

function CompetitionStatsTable({ rows }: { rows: OpponentCompetitionStatRow[] }) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma competição registrada neste confronto.</p>
    );
  }

  return (
    <div className="border rounded overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="py-2">Competição</TableHead>
            <TableHead className="py-2 text-right">J</TableHead>
            <TableHead className="py-2 text-right">V</TableHead>
            <TableHead className="py-2 text-right">E</TableHead>
            <TableHead className="py-2 text-right">D</TableHead>
            <TableHead className="py-2 text-right">GP</TableHead>
            <TableHead className="py-2 text-right">GC</TableHead>
            <TableHead className="py-2 text-right">SG</TableHead>
            <TableHead className="py-2 text-right">Aproveit.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.flatMap((r) => {
            const variants = r.variants ?? [];
            const open = openIds.has(r.competitionId);
            const parent = (
              <TableRow key={r.competitionId} className="text-sm">
                <TableCell className="py-2 font-medium">
                  <div className="inline-flex items-center gap-1.5">
                    {variants.length > 0 ? (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-expanded={open}
                        onClick={() => toggle(r.competitionId)}
                      >
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    ) : null}
                    {r.competitionName}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">{r.matches}</TableCell>
                <TableCell className="py-2 text-right tabular-nums text-green-600">{r.wins}</TableCell>
                <TableCell className="py-2 text-right tabular-nums text-amber-600">{r.draws}</TableCell>
                <TableCell className="py-2 text-right tabular-nums text-red-600">{r.losses}</TableCell>
                <TableCell className="py-2 text-right tabular-nums">{r.goalsFor}</TableCell>
                <TableCell className="py-2 text-right tabular-nums">{r.goalsAgainst}</TableCell>
                <TableCell className="py-2 text-right tabular-nums font-medium">
                  {r.goalsFor - r.goalsAgainst > 0 ? "+" : ""}
                  {r.goalsFor - r.goalsAgainst}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">{pct(r.wins, r.matches)}</TableCell>
              </TableRow>
            );
            if (!open || variants.length === 0) return [parent];
            return [
              parent,
              ...variants.map((v) => (
                <TableRow key={`${r.competitionId}-${v.competitionId}`} className="text-sm bg-muted/30">
                  <TableCell className="py-2 pl-8 text-muted-foreground">{v.competitionName}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums">{v.matches}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums text-green-600">{v.wins}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums text-amber-600">{v.draws}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums text-red-600">{v.losses}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums">{v.goalsFor}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums">{v.goalsAgainst}</TableCell>
                  <TableCell className="py-2 text-right tabular-nums font-medium">
                    {v.goalsFor - v.goalsAgainst > 0 ? "+" : ""}
                    {v.goalsFor - v.goalsAgainst}
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums">{pct(v.wins, v.matches)}</TableCell>
                </TableRow>
              )),
            ];
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function HighlightRankRow({
  href,
  rank,
  name,
  value,
}: {
  href: string;
  rank: number;
  name: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 hover:underline"
    >
      <span className="min-w-0 overflow-hidden leading-snug break-words">
        <span className="text-muted-foreground tabular-nums mr-1.5">{rank}.</span>
        <span className="font-bold">{name}</span>
      </span>
      <span className="shrink-0 text-right tabular-nums font-semibold text-primary whitespace-nowrap leading-snug">
        {value}
      </span>
    </Link>
  );
}

function HighlightTop3Card({
  label,
  entries,
  valueText,
  hrefOf,
  testId,
  className,
}: {
  label: string;
  entries: OpponentHighlightEntry[];
  valueText: (value: number) => string;
  hrefOf: (id: number) => string;
  testId: string;
  className?: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className={`border rounded p-4 space-y-2 ${className ?? ""}`} data-testid={testId}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <ol className="space-y-2">
        {entries.map((entry, i) => (
          <li key={entry.id}>
            <HighlightRankRow
              href={hrefOf(entry.id)}
              rank={i + 1}
              name={entry.name}
              value={valueText(entry.value)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ManagerTop3Card({
  label,
  entries,
  valueText,
  testId,
  className,
}: {
  label: string;
  entries: OpponentManagerHighlightEntry[];
  valueText: (entry: OpponentManagerHighlightEntry) => string;
  testId: string;
  className?: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className={`border rounded p-4 space-y-2 ${className ?? ""}`} data-testid={testId}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <ol className="space-y-2">
        {entries.map((entry, i) => (
          <li key={entry.id}>
            <HighlightRankRow
              href={`/tecnicos/${entry.id}`}
              rank={i + 1}
              name={entry.name}
              value={valueText(entry)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatScore(gf: number, ga: number) {
  return `${gf}–${ga}`;
}

function MarginCard({
  label,
  entry,
  colorClass,
  testId,
}: {
  label: string;
  entry: OpponentMarginMatch | null | undefined;
  colorClass: string;
  testId: string;
}) {
  if (!entry) return null;
  const otherTies = entry.tiedCount > 1 ? entry.tiedCount - 1 : 0;
  return (
    <Link
      href={`/partidas/${entry.matchId}`}
      className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
      data-testid={testId}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${colorClass}`}>
        {formatScore(entry.goalsFor, entry.goalsAgainst)}
      </p>
      <p className="text-sm text-muted-foreground">
        {fmtDate(entry.date)} · {entry.competition}
      </p>
      {otherTies > 0 && (
        <p className="text-xs text-muted-foreground">
          empatado com {otherTies} {otherTies === 1 ? "outro" : "outros"}
        </p>
      )}
    </Link>
  );
}

function RepeatedScorelinesCard({ items }: { items: OpponentRepeatedScoreline[] }) {
  if (items.length === 0) return null;
  const count = items[0].count;
  const scores = items.map((i) => formatScore(i.goalsFor, i.goalsAgainst)).join(" e ");
  const timesLabel = count === 1 ? "1×" : `${count}×`;
  const suffix = items.length > 1 ? `${timesLabel} cada` : timesLabel;
  return (
    <div className="border rounded p-4 space-y-1" data-testid="milestone-repeated-score">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Placar Mais Repetido</p>
      <p className="text-2xl font-black text-primary">{scores}</p>
      <p className="text-sm text-muted-foreground">{suffix}</p>
    </div>
  );
}

function mandoLabel(homeAway: string) {
  if (homeAway === "home") return "Casa";
  if (homeAway === "away") return "Fora";
  return "Neutro";
}

function ConfrontationCard({
  label,
  entry,
  testId,
}: {
  label: string;
  entry: OpponentConfrontationMatch | null | undefined;
  testId: string;
}) {
  if (!entry) return null;
  const score =
    entry.goalsFor != null && entry.goalsAgainst != null
      ? formatScore(entry.goalsFor, entry.goalsAgainst)
      : "–";
  const place = [mandoLabel(entry.homeAway), entry.stadium].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/partidas/${entry.matchId}`}
      className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
      data-testid={testId}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-primary">{score}</p>
      <p className="text-sm text-muted-foreground">
        {fmtDate(entry.date)} · {entry.competition}
      </p>
      {place ? <p className="text-xs text-muted-foreground">{place}</p> : null}
    </Link>
  );
}

function OpponentHighlightsSection({ highlights }: { highlights: OpponentHighlights }) {
  const topScorers = highlights.topScorers?.length
    ? highlights.topScorers
    : highlights.topScorer
      ? [highlights.topScorer]
      : [];
  const mostAppearances = highlights.mostAppearancesTop?.length
    ? highlights.mostAppearancesTop
    : highlights.mostAppearances
      ? [highlights.mostAppearances]
      : [];
  const topAssists = highlights.topAssistsTop?.length
    ? highlights.topAssistsTop
    : highlights.topAssists
      ? [highlights.topAssists]
      : [];

  if (topScorers.length === 0 && mostAppearances.length === 0 && topAssists.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Destaques do confronto (Jogadores)
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <HighlightTop3Card
          label="Artilheiro"
          entries={topScorers}
          valueText={(v) => `${v} ${v === 1 ? "gol" : "gols"}`}
          hrefOf={(id) => `/jogadores/${id}`}
          testId="highlight-top-scorer"
        />
        <HighlightTop3Card
          label="Mais Jogos"
          entries={mostAppearances}
          valueText={(v) => `${v} ${v === 1 ? "jogo" : "jogos"}`}
          hrefOf={(id) => `/jogadores/${id}`}
          testId="highlight-most-appearances"
        />
        <HighlightTop3Card
          label="Mais Assistências"
          entries={topAssists}
          valueText={(v) => `${v} assist.`}
          hrefOf={(id) => `/jogadores/${id}`}
          testId="highlight-top-assists"
        />
      </div>
    </section>
  );
}

function UpcomingMatchesCard({ matches }: { matches: OpponentUpcomingMatch[] }) {
  if (matches.length === 0) return null;
  const title = matches.length === 1 ? "Próximo confronto" : "Próximos confrontos";
  return (
    <section
      className="border border-primary/25 bg-primary/5 rounded p-4 space-y-3"
      data-testid="sidebar-upcoming"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-3">
        {matches.map((m) => {
          const place = [mandoLabel(m.homeAway), m.stadium].filter(Boolean).join(" · ");
          return (
            <li key={m.matchId}>
              <Link
                href={`/partidas/${m.matchId}`}
                className="block hover:bg-background/60 rounded -mx-1 px-1 py-0.5 transition-colors"
              >
                <p className="text-sm font-semibold">{fmtDate(m.date)}</p>
                <p className="text-sm text-muted-foreground">{m.competition}</p>
                {place ? <p className="text-xs text-muted-foreground mt-0.5">{place}</p> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RelatedOpponentsCard({
  uf,
  opponents,
}: {
  uf: string | null | undefined;
  opponents: OpponentRelatedSummary[];
}) {
  if (opponents.length === 0) return null;
  const stateName = uf ? ufDisplayName(uf) : null;
  return (
    <section className="border rounded p-4 space-y-3" data-testid="sidebar-related">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {stateName ? `Outros adversários de ${stateName}` : "Outros adversários do mesmo estado"}
      </h2>
      <ul className="space-y-2">
        {opponents.map((o) => (
          <li key={o.id}>
            <Link
              href={`/adversarios/${o.id}`}
              className="flex items-center gap-2 min-w-0 hover:text-primary"
              data-testid={`sidebar-related-${o.id}`}
            >
              <OpponentCrest url={o.logoUrl} name={o.name} size="sm" fallback />
              <span className="text-sm font-medium truncate">{o.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {uf ? (
        <Link
          href={`/partidas/por-estado/${uf}`}
          className="text-xs text-primary hover:underline"
        >
          Ver todos de {stateName}
        </Link>
      ) : null}
    </section>
  );
}

function PrimaryStadiumCard({ stadium }: { stadium: OpponentClubStadium | undefined }) {
  if (!stadium) return null;
  const place = [stadium.city, stadium.state].filter(Boolean).join(", ");
  return (
    <Link
      href={`/estadios/${stadium.id}`}
      className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
      data-testid="sidebar-primary-stadium"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Estádio principal
      </p>
      <p className="font-semibold">{stadium.name}</p>
      {place ? <p className="text-sm text-muted-foreground">{place}</p> : null}
    </Link>
  );
}

function OpponentSidebar({
  upcomingMatches,
  relatedOpponents,
  relatedUf,
  primaryStadium,
}: {
  upcomingMatches: OpponentUpcomingMatch[];
  relatedOpponents: OpponentRelatedSummary[];
  relatedUf: string | null | undefined;
  primaryStadium: OpponentClubStadium | undefined;
}) {
  if (upcomingMatches.length === 0 && relatedOpponents.length === 0 && !primaryStadium) {
    return null;
  }
  return (
    <aside className="space-y-4 lg:sticky lg:top-20" data-testid="opponent-sidebar">
      <UpcomingMatchesCard matches={upcomingMatches} />
      <RelatedOpponentsCard uf={relatedUf} opponents={relatedOpponents} />
      <PrimaryStadiumCard stadium={primaryStadium} />
    </aside>
  );
}

function OpponentManagerHighlightsSection({
  highlights,
}: {
  highlights: OpponentManagerHighlights;
}) {
  if (
    highlights.mostMatches.length === 0 &&
    highlights.mostWins.length === 0 &&
    highlights.bestWinPct.length === 0
  ) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Destaques do confronto (Treinadores)
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ManagerTop3Card
          label="Mais Jogos"
          entries={highlights.mostMatches}
          valueText={(e) => `${e.games} ${e.games === 1 ? "jogo" : "jogos"}`}
          testId="highlight-manager-matches"
        />
        <ManagerTop3Card
          label="Mais Vitórias"
          entries={highlights.mostWins}
          valueText={(e) => `${e.wins} ${e.wins === 1 ? "vitória" : "vitórias"}`}
          testId="highlight-manager-wins"
        />
        <ManagerTop3Card
          label="Melhor aproveitamento"
          entries={highlights.bestWinPct}
          valueText={(e) => `${e.winPct.toFixed(1)}% (${e.wins}V ${e.draws}E ${e.losses}D)`}
          testId="highlight-manager-winpct"
          className="sm:col-span-2"
        />
      </div>
    </section>
  );
}

export default function OpponentDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id ?? "0", 10);
  const [showAllMatches, setShowAllMatches] = useState(false);

  const { data: opponent, isLoading, isError } = useGetOpponent(id, {
    query: { enabled: !!id, queryKey: getGetOpponentQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-7xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !opponent) {
    return <div className="text-center p-8 text-destructive">Adversário não encontrado.</div>;
  }

  const allMatches = opponent.allMatches ?? [];
  const competitionStats = opponent.competitionStats ?? [];
  const visibleMatches = showAllMatches ? allMatches : allMatches.slice(0, HISTORY_PREVIEW);
  const canExpandHistory = allMatches.length > HISTORY_PREVIEW;
  const upcomingMatches = opponent.upcomingMatches ?? [];
  const relatedOpponents = opponent.relatedOpponents ?? [];
  const primaryStadium = opponent.stadiums?.find((s) => s.isPrimary);
  const showSidebar =
    upcomingMatches.length > 0 || relatedOpponents.length > 0 || !!primaryStadium;

  return (
    <div className="space-y-5 max-w-7xl">
      <Link href="/adversarios">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Adversários
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1
              className="text-3xl font-black inline-flex items-center gap-3 flex-wrap"
              data-testid="heading-opponent"
            >
              <OpponentCrest url={opponent.logoUrl} name={opponent.name} size="lg" fallback />
              <span>{opponent.name}</span>
            </h1>
            {(opponent.city || opponent.state || opponent.country) && (
              <p className="text-sm text-muted-foreground mt-1">
                {opponent.country
                  ? [opponent.city, countryDisplayName(opponent.country)].filter(Boolean).join(", ")
                  : [opponent.city, opponent.state].filter(Boolean).join(", ")}
              </p>
            )}
            {(opponent.foundedOn || opponent.foundingYear != null) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Fundado em{" "}
                {opponent.foundedOn
                  ? formatDateBr(opponent.foundedOn, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : opponent.foundingYear}
              </p>
            )}
          </div>
          <ShareButton title={`CSA x ${opponent.name}`} />
        </div>
        {(opponent.stadiums?.length ?? 0) > 0 && (
          <div className="mt-3" data-testid="opponent-stadiums">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {(opponent.stadiums?.length ?? 0) === 1 ? "Estádio" : "Estádios"}
            </p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {opponent.stadiums!.map((s) => (
                <li key={s.id}>
                  <Link href={`/estadios/${s.id}`} className="text-primary hover:underline font-medium">
                    {s.name}
                  </Link>
                  {s.isPrimary ? (
                    <span className="ml-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      principal
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div
        className={
          showSidebar
            ? "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start"
            : undefined
        }
      >
        <div className={showSidebar ? "lg:col-span-2 space-y-5 min-w-0" : "space-y-5"}>
      {/* Histórico por competições */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Histórico por Competições
        </h2>
        <CompetitionStatsTable rows={competitionStats} />
      </section>

      {/* Resumo geral */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Resumo Geral
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-border rounded overflow-hidden" data-testid="opponent-stat-bar">
          {[
            { label: "Partidas", value: opponent.matches, highlight: true },
            { label: "Vitórias", value: opponent.wins, color: "text-green-600" },
            { label: "Empates", value: opponent.draws, color: "text-amber-600" },
            { label: "Derrotas", value: opponent.losses, color: "text-red-600" },
            { label: "Gols Pró", value: opponent.goalsFor, highlight: true },
            { label: "Gols Contra", value: opponent.goalsAgainst },
            { label: "Aproveit.", value: pct(opponent.wins, opponent.matches), highlight: true },
          ].map(({ label, value, color, highlight }) => (
            <div key={label} className="bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Home/Away breakdown */}
      {(opponent.homeRecord || opponent.awayRecord) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {opponent.homeRecord && (
            <div className="border rounded p-4 space-y-2">
              <MiniRecord label="Como Mandante" data={opponent.homeRecord} />
            </div>
          )}
          {opponent.awayRecord && (
            <div className="border rounded p-4 space-y-2">
              <MiniRecord label="Como Visitante" data={opponent.awayRecord} />
            </div>
          )}
        </div>
      )}

      {/* Marcos do confronto (jogos de campo) */}
      {(opponent.biggestVictory ||
        opponent.biggestDefeat ||
        (opponent.mostRepeatedScorelines?.length ?? 0) > 0 ||
        opponent.firstMatch ||
        opponent.lastMatch) && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Marcos do Confronto
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ConfrontationCard
              label="Primeiro confronto"
              entry={opponent.firstMatch}
              testId="milestone-first-match"
            />
            <ConfrontationCard
              label="Último confronto"
              entry={opponent.lastMatch}
              testId="milestone-last-match"
            />
            <MarginCard
              label="Maior Vitória"
              entry={opponent.biggestVictory}
              colorClass="text-green-600"
              testId="milestone-biggest-victory"
            />
            <MarginCard
              label="Maior Derrota"
              entry={opponent.biggestDefeat}
              colorClass="text-red-600"
              testId="milestone-biggest-defeat"
            />
            <RepeatedScorelinesCard items={opponent.mostRepeatedScorelines ?? []} />
          </div>
        </section>
      )}

      {/* Destaques (somente com ficha) */}
      {opponent.highlights ? (
        <OpponentHighlightsSection highlights={opponent.highlights} />
      ) : null}

      {opponent.managerHighlights ? (
        <OpponentManagerHighlightsSection highlights={opponent.managerHighlights} />
      ) : null}

      {/* Histórico de confrontos */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Confrontos
            <span className="ml-2 font-normal text-xs">({allMatches.length} {allMatches.length === 1 ? "jogo" : "jogos"})</span>
          </h2>
          {canExpandHistory && (
            <button
              type="button"
              className="text-xs text-primary hover:underline shrink-0"
              onClick={() => setShowAllMatches((v) => !v)}
              data-testid="toggle-all-matches"
            >
              {showAllMatches ? "Ver menos" : "Ver todos"}
            </button>
          )}
        </div>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2">Data</TableHead>
                <TableHead className="py-2">Temporada</TableHead>
                <TableHead className="py-2 text-center">Res.</TableHead>
                <TableHead className="py-2 text-center">Placar</TableHead>
                <TableHead className="py-2">Mando</TableHead>
                <TableHead className="py-2">Competição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">Sem confrontos registrados.</TableCell>
                </TableRow>
              ) : (
                visibleMatches.map((match) => (
                  <TableRow
                    key={match.id}
                    className="text-sm cursor-pointer hover:bg-muted/40"
                    onClick={() => setLocation(`/partidas/${match.id}`)}
                    data-testid={`row-match-${match.id}`}
                  >
                    <TableCell className="py-2 text-muted-foreground text-xs">{fmtDate(match.date)}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{match.season}</TableCell>
                    <TableCell className="py-2 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <ResultBadge result={match.result} />
                        {match.isWalkover ? <WalkoverBadge /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center font-mono font-bold">{match.goalsFor}–{match.goalsAgainst}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{match.homeAway === "home" ? "Casa" : "Fora"}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      <div>{match.competition}</div>
                      {matchPhaseRoundLabel(match.phase, match.round) && (
                        <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                          {matchPhaseRoundLabel(match.phase, match.round)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {canExpandHistory && !showAllMatches && (
          <div className="mt-3 text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAllMatches(true)}
              data-testid="button-see-all-matches"
            >
              Ver todos os {allMatches.length} jogos
            </Button>
          </div>
        )}
      </div>

      <EntitySuggestionForm entityType="opponent" entityId={opponent.id} />
        </div>

        {showSidebar ? (
          <OpponentSidebar
            upcomingMatches={upcomingMatches}
            relatedOpponents={relatedOpponents}
            relatedUf={opponent.relatedOpponentsUf}
            primaryStadium={primaryStadium}
          />
        ) : null}
      </div>
    </div>
  );
}
