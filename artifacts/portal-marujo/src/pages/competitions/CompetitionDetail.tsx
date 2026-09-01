import { Link, useParams } from "wouter";
import type { ReactNode } from "react";
import { useGetCompetition, getGetCompetitionQueryKey } from "@workspace/api-client-react";
import type { CompetitionDetail } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { BrazilFlag } from "@/components/BrazilFlag";
import { ShareButton } from "@/components/ShareButton";
import type {
  CompetitionParentRef,
  CompetitionSeasonRow,
  CompetitionVariant,
} from "@/lib/competition-variants";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

const NIVEL: Record<string, string> = {
  state: "Estadual",
  league: "Nacional",
  regional: "Regional",
  cup: "Copa",
  friendly: "Amistoso",
};
function nivel(type?: string | null) {
  return type ? (NIVEL[type] ?? type) : null;
}

type HighlightEntry = { id: number; name: string; value: number };

type CompetitionHighlights = {
  mostAppearances: HighlightEntry | null;
  topScorer: HighlightEntry | null;
  managerMostMatches: HighlightEntry | null;
  managerMostWins: HighlightEntry | null;
};

type CompetitionDetailWithHighlights = CompetitionDetail & {
  highlights?: CompetitionHighlights | null;
  parent?: CompetitionParentRef | null;
  variants?: CompetitionVariant[];
  seasonStats: CompetitionSeasonRow[];
};

function HighlightCard({
  label,
  name,
  href,
  valueText,
  testId,
}: {
  label: string;
  name: string;
  href: string;
  valueText: string;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
      data-testid={testId}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-bold text-base truncate">{name}</p>
      <p className="text-2xl font-black text-primary">{valueText}</p>
    </Link>
  );
}

function CompetitionHighlightsSection({
  highlights,
}: {
  highlights: CompetitionHighlights | null | undefined;
}) {
  if (!highlights) return null;

  const { mostAppearances, topScorer, managerMostMatches, managerMostWins } = highlights;
  const sameManager =
    managerMostMatches &&
    managerMostWins &&
    managerMostMatches.id === managerMostWins.id;

  const cards: ReactNode[] = [];

  if (mostAppearances) {
    cards.push(
      <HighlightCard
        key="apps"
        label="Mais jogos"
        name={mostAppearances.name}
        href={`/jogadores/${mostAppearances.id}`}
        valueText={`${mostAppearances.value} ${mostAppearances.value === 1 ? "jogo" : "jogos"}`}
        testId="highlight-most-appearances"
      />,
    );
  }

  if (topScorer) {
    cards.push(
      <HighlightCard
        key="goals"
        label="Artilheiro"
        name={topScorer.name}
        href={`/jogadores/${topScorer.id}`}
        valueText={`${topScorer.value} ${topScorer.value === 1 ? "gol" : "gols"}`}
        testId="highlight-top-scorer"
      />,
    );
  }

  if (sameManager && managerMostMatches && managerMostWins) {
    cards.push(
      <HighlightCard
        key="mgr-combined"
        label="Técnico em destaque"
        name={managerMostMatches.name}
        href={`/tecnicos/${managerMostMatches.id}`}
        valueText={`${managerMostMatches.value} ${managerMostMatches.value === 1 ? "jogo" : "jogos"}, ${managerMostWins.value} ${managerMostWins.value === 1 ? "vitória" : "vitórias"}`}
        testId="highlight-manager-combined"
      />,
    );
  } else {
    if (managerMostMatches) {
      cards.push(
        <HighlightCard
          key="mgr-matches"
          label="Técnico com mais jogos"
          name={managerMostMatches.name}
          href={`/tecnicos/${managerMostMatches.id}`}
          valueText={`${managerMostMatches.value} ${managerMostMatches.value === 1 ? "jogo" : "jogos"}`}
          testId="highlight-manager-matches"
        />,
      );
    }
    if (managerMostWins) {
      cards.push(
        <HighlightCard
          key="mgr-wins"
          label="Técnico com mais vitórias"
          name={managerMostWins.name}
          href={`/tecnicos/${managerMostWins.id}`}
          valueText={`${managerMostWins.value} ${managerMostWins.value === 1 ? "vitória" : "vitórias"}`}
          testId="highlight-manager-wins"
        />,
      );
    }
  }

  if (cards.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="section-competition-highlights">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Destaques da Competição
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{cards}</div>
    </section>
  );
}

export default function CompetitionDetailPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);

  const { data, isLoading, isError } = useGetCompetition(id, {
    query: { enabled: !!id, queryKey: getGetCompetitionQueryKey(id) },
  });

  const comp = data as CompetitionDetailWithHighlights | undefined;

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !comp) {
    return <div className="text-center p-8 text-destructive">Competição não encontrada.</div>;
  }

  const gd = (comp.goalsScored ?? 0) - (comp.goalsConceded ?? 0);
  const variants = (comp.variants ?? []).filter((v) => v.matches > 0);
  const seasonStats = comp.seasonStats ?? [];
  const showFormatColumn = seasonStats.some(
    (s) => s.competitionName && s.competitionName !== comp.name,
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/competicoes">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Competições
        </span>
      </Link>

      <div className="border-b pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold inline-flex items-center gap-2" data-testid="heading-competition">
            <BrazilFlag size="md" title="Brasil" />
            {comp.name}
            <ShareButton title={comp.name} />
          </h1>
          {nivel(comp.type) && <p className="text-sm text-muted-foreground mt-1">{nivel(comp.type)}</p>}
          {comp.parent ? (
            <p className="text-sm text-muted-foreground mt-2">
              Formato histórico do{" "}
              <Link href={`/competicoes/${comp.parent.id}`} className="text-primary hover:underline">
                {comp.parent.name}
              </Link>
            </p>
          ) : null}
        </div>
        {comp.titles ? (
          <span className="text-sm bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1.5 rounded font-bold whitespace-nowrap">
            {comp.titles}x Campeão
          </span>
        ) : null}
      </div>

      <div
        className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-border rounded overflow-hidden"
        data-testid="competition-stat-bar"
      >
        {[
          { label: "Partidas", value: comp.matches, highlight: true },
          { label: "Vitórias", value: comp.wins, color: "text-green-600" },
          { label: "Empates", value: comp.draws, color: "text-amber-600" },
          { label: "Derrotas", value: comp.losses, color: "text-red-600" },
          { label: "GP", value: comp.goalsScored ?? 0 },
          { label: "GC", value: comp.goalsConceded ?? 0 },
          {
            label: "Saldo",
            value: (gd >= 0 ? "+" : "") + gd,
            color: gd >= 0 ? "text-green-600" : "text-red-600",
          },
          { label: "Aproveit.", value: pct(comp.wins, comp.matches), highlight: true },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">
              {label}
            </p>
            <p
              className={`text-lg font-bold mt-0.5 tabular-nums ${color ?? (highlight ? "text-primary" : "")}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {comp.matches > 0 ? (
        <p className="text-sm">
          <Link
            href={`/partidas?competitionId=${comp.id}`}
            className="text-primary hover:underline"
            data-testid="link-competition-matches"
          >
            Ver partidas desta competição →
          </Link>
        </p>
      ) : null}

      <CompetitionHighlightsSection highlights={comp.highlights} />

      {variants.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Formatos históricos
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Nomes oficiais de cada era, todos computados nas estatísticas acima.
          </p>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Formato</TableHead>
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right text-green-600">V</TableHead>
                  <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                  <TableHead className="py-2 text-right text-red-600">D</TableHead>
                  <TableHead className="py-2 text-right">GP</TableHead>
                  <TableHead className="py-2 text-right">GC</TableHead>
                  <TableHead className="py-2 text-right">Aproveit.</TableHead>
                  <TableHead className="py-2 text-right">Última Ed.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => (
                  <TableRow key={v.id} className="text-sm" data-testid={`row-competition-variant-${v.id}`}>
                    <TableCell className="py-2 font-medium">
                      {v.id === comp.id ? (
                        v.name
                      ) : (
                        <Link href={`/competicoes/${v.id}`} className="hover:text-primary hover:underline">
                          {v.name}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-right">{v.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{v.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{v.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{v.losses}</TableCell>
                    <TableCell className="py-2 text-right">{v.goalsScored}</TableCell>
                    <TableCell className="py-2 text-right">{v.goalsConceded}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{pct(v.wins, v.matches)}</TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {v.lastParticipation ?? "–"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {seasonStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Histórico por Edição
          </h2>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Edição</TableHead>
                  {showFormatColumn ? <TableHead className="py-2">Formato</TableHead> : null}
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right text-green-600">V</TableHead>
                  <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                  <TableHead className="py-2 text-right text-red-600">D</TableHead>
                  <TableHead className="py-2 text-right">GP</TableHead>
                  <TableHead className="py-2 text-right">GC</TableHead>
                  <TableHead className="py-2 text-right">Aproveit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasonStats.map((s) => (
                  <TableRow
                    key={`${s.year}-${s.competitionId ?? s.competitionName ?? ""}`}
                    className="text-sm"
                    data-testid={`row-competition-season-${s.year}`}
                  >
                    <TableCell className="py-2 font-medium">
                      <Link href={`/temporadas/${s.year}`} className="hover:text-primary hover:underline">
                        {s.year}
                      </Link>
                    </TableCell>
                    {showFormatColumn ? (
                      <TableCell className="py-2 text-muted-foreground text-xs">
                        {s.competitionId && s.competitionId !== comp.id ? (
                          <Link href={`/competicoes/${s.competitionId}`} className="hover:text-primary hover:underline">
                            {s.competitionName}
                          </Link>
                        ) : (
                          s.competitionName ?? "–"
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell className="py-2 text-right">{s.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{s.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{s.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{s.losses}</TableCell>
                    <TableCell className="py-2 text-right">{s.goalsScored}</TableCell>
                    <TableCell className="py-2 text-right">{s.goalsConceded}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{pct(s.wins, s.matches)}</TableCell>
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
