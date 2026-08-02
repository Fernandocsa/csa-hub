import { Link } from "wouter";
import {
  useGetClassico,
  type OpponentHighlightEntry,
  type OpponentHighlights,
  type OpponentMarginMatch,
  type OpponentRepeatedScoreline,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultBadge } from "@/components/ui/result-badge";
import { OpponentCrest, CsaCrest } from "@/components/OpponentCrest";
import { ShareButton } from "@/components/ShareButton";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { formatDateBr, formatInt } from "@/lib/utils";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function formatScore(gf: number, ga: number) {
  return `${gf}–${ga}`;
}

function MiniRecord({
  label,
  data: d,
}: {
  label: string;
  data: { matches: number; wins: number; draws: number; losses: number };
}) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-bold">{d.matches}J</span>
        <span className="text-green-600 font-medium">{d.wins}V</span>
        <span className="text-amber-600">{d.draws}E</span>
        <span className="text-red-600">{d.losses}D</span>
        <span className="text-muted-foreground">{pct(d.wins, d.matches)}</span>
      </div>
    </div>
  );
}

function MarginCard({
  label,
  entry,
  colorClass,
}: {
  label: string;
  entry: OpponentMarginMatch | null | undefined;
  colorClass: string;
}) {
  if (!entry) return null;
  return (
    <Link
      href={`/partidas/${entry.matchId}`}
      className="rounded-lg bg-background/80 p-4 space-y-1 block hover:bg-background transition-colors border border-white/10"
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-black ${colorClass}`}>
        {formatScore(entry.goalsFor, entry.goalsAgainst)}
      </p>
      <p className="text-sm text-muted-foreground">
        {formatDateBr(entry.date)} · {entry.competition}
      </p>
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
    <div className="rounded-lg bg-background/80 p-4 space-y-1 border border-white/10">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Placar mais repetido
      </p>
      <p className="text-2xl font-black text-primary">{scores}</p>
      <p className="text-sm text-muted-foreground">{suffix}</p>
    </div>
  );
}

function HighlightCards({ highlights }: { highlights: OpponentHighlights }) {
  const cards = [
    highlights.topScorer && {
      label: "Artilheiro no clássico",
      entry: highlights.topScorer,
      suffix: "gols",
      href: `/jogadores/${highlights.topScorer.id}`,
    },
    highlights.mostAppearances && {
      label: "Mais jogos",
      entry: highlights.mostAppearances,
      suffix: "jogos",
      href: `/jogadores/${highlights.mostAppearances.id}`,
    },
    highlights.topAssists && {
      label: "Mais assistências",
      entry: highlights.topAssists,
      suffix: "assist.",
      href: `/jogadores/${highlights.topAssists.id}`,
    },
  ].filter(Boolean) as {
    label: string;
    entry: OpponentHighlightEntry;
    suffix: string;
    href: string;
  }[];

  if (!cards.length) return null;
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="border rounded p-3 hover:bg-muted/40 transition-colors"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
          <p className="font-bold mt-1">{c.entry.name}</p>
          <p className="text-xl font-black text-primary">
            {c.entry.value}{" "}
            <span className="text-sm font-normal text-muted-foreground">{c.suffix}</span>
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function ClassicoPage() {
  const { data, isLoading, isError } = useGetClassico();
  const matches = data?.allMatches ?? [];
  const { page, setPage, pageSize, total, slice, needsPagination } = useClientPage(matches);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o clássico CSA × CRB.
      </p>
    );
  }

  const aproveitamento = pct(data.wins, data.matches);

  return (
    <div className="space-y-8">
      <header
        className="relative overflow-hidden rounded-xl bg-[#1B3A6B] text-white px-5 py-8 sm:px-8 sm:py-10"
        data-testid="classico-hero"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, #F5A62355, transparent 55%), radial-gradient(ellipse at 90% 100%, #ffffff22, transparent 50%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <CsaCrest size="lg" className="!h-14 !w-14 sm:!h-16 sm:!w-16" />
            <span className="text-2xl font-black text-white/70">×</span>
            <OpponentCrest
              name={data.opponentName}
              url={data.opponentLogoUrl}
              size="lg"
              fallback
              className="!h-14 !w-14 sm:!h-16 sm:!w-16"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623]">
              {data.title}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              {data.subtitle}
            </h1>
            <p className="text-sm text-white/70 mt-1">
              O confronto mais frequente da história do CSA
            </p>
          </div>
          <ShareButton title="Clássico CSA × CRB" className="text-white/80" />
        </div>

        <div className="relative mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Jogos", value: formatInt(data.matches) },
            { label: "Vitórias", value: formatInt(data.wins), className: "text-green-300" },
            { label: "Empates", value: formatInt(data.draws), className: "text-amber-200" },
            { label: "Derrotas", value: formatInt(data.losses), className: "text-red-300" },
            { label: "Aproveit.", value: aproveitamento },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-lg px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-white/60">{s.label}</p>
              <p className={`text-xl font-black tabular-nums ${s.className ?? ""}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <p className="relative mt-3 text-sm text-white/70">
          Gols: {formatInt(data.goalsFor)} pró × {formatInt(data.goalsAgainst)} contra
        </p>
      </header>

      <div className="flex flex-wrap gap-6">
        <MiniRecord label="Mandante" data={data.homeRecord} />
        <MiniRecord label="Visitante" data={data.awayRecord} />
        <Link
          href={`/adversarios/${data.opponentId}`}
          className="text-sm text-primary hover:underline self-end ml-auto"
        >
          Ver página completa do CRB →
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Marcos do confronto
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 bg-[#1B3A6B]/[0.06] rounded-xl p-3 border border-[#1B3A6B]/10">
          <MarginCard
            label="Maior vitória"
            entry={data.biggestVictory}
            colorClass="text-green-600"
          />
          <MarginCard
            label="Maior derrota"
            entry={data.biggestDefeat}
            colorClass="text-red-600"
          />
          <RepeatedScorelinesCard items={data.mostRepeatedScorelines ?? []} />
        </div>
      </section>

      {data.highlights && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Destaques individuais
          </h2>
          <HighlightCards highlights={data.highlights} />
        </section>
      )}

      {(data.biggestAttendances?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Maiores públicos
          </h2>
          <div className="border rounded overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">#</TableHead>
                  <TableHead className="py-2">Data</TableHead>
                  <TableHead className="py-2">Competição</TableHead>
                  <TableHead className="py-2 text-right">Público</TableHead>
                  <TableHead className="py-2 text-right">Placar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.biggestAttendances.map((m, i) => (
                  <TableRow key={m.id} className="text-sm">
                    <TableCell className="py-2 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="py-2">
                      <Link href={`/partidas/${m.id}`} className="hover:text-primary hover:underline">
                        {formatDateBr(m.date)}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">{m.competition}</TableCell>
                    <TableCell className="py-2 text-right font-medium tabular-nums">
                      {formatInt(m.attendance)}
                    </TableCell>
                    <TableCell className="py-2 text-right tabular-nums">
                      {m.goalsFor ?? "–"}–{m.goalsAgainst ?? "–"}{" "}
                      <ResultBadge result={m.result} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Histórico de jogos
        </h2>
        <div className="border rounded overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2">Data</TableHead>
                <TableHead className="py-2">Competição</TableHead>
                <TableHead className="py-2">Local</TableHead>
                <TableHead className="py-2 text-right">Placar</TableHead>
                <TableHead className="py-2 text-right">Res.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((m) => (
                <TableRow key={m.id} className="text-sm">
                  <TableCell className="py-2 whitespace-nowrap">
                    <Link
                      href={`/partidas/${m.id}`}
                      className="hover:text-primary hover:underline tabular-nums"
                    >
                      {formatDateBr(m.date)}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2">
                    <div>{m.competition}</div>
                    <div className="text-xs text-muted-foreground">
                      {matchPhaseRoundLabel(m.phase, m.round)}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-muted-foreground">
                    {m.homeAway === "home" ? "Casa" : m.homeAway === "away" ? "Fora" : m.homeAway}
                    {m.stadium ? ` · ${m.stadium}` : ""}
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums font-medium">
                    {m.goalsFor ?? "–"}–{m.goalsAgainst ?? "–"}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <ResultBadge result={m.result} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {needsPagination && (
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        )}
      </section>
    </div>
  );
}
