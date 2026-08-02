import { Link } from "wouter";
import type { ReactNode } from "react";
import {
  useGetTopScorers,
  useGetTopAppearances,
  useGetTopAssists,
  useGetStreaks,
  useGetTitles,
} from "@workspace/api-client-react";
import { RecordsLayout } from "./RecordsLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInt } from "@/lib/utils";

type Highlight = {
  href: string;
  eyebrow: string;
  title: string;
  value: ReactNode;
  hint?: string;
};

export default function Records() {
  const { data: scorers, isLoading: lSc } = useGetTopScorers({ limit: 1 });
  const { data: apps, isLoading: lAp } = useGetTopAppearances({ limit: 1 });
  const { data: assists, isLoading: lAs } = useGetTopAssists({ limit: 1 });
  const { data: streaks, isLoading: lSt } = useGetStreaks();
  const { data: titles, isLoading: lTi } = useGetTitles();

  const loading = lSc || lAp || lAs || lSt || lTi;
  const topScorer = Array.isArray(scorers) ? scorers[0] : undefined;
  const topApps = Array.isArray(apps) ? apps[0] : undefined;
  const topAssists = Array.isArray(assists) ? assists[0] : undefined;
  const streakList = Array.isArray(streaks) ? streaks : [];
  const unbeaten = streakList.find((s) => s.type === "unbeaten");
  const winning = streakList.find((s) => s.type === "winning");

  const cards: Highlight[] = [
    {
      href: "/titulos",
      eyebrow: "Títulos",
      title: "Campeonatos conquistados",
      value: (
        <>
          {formatInt(titles?.total ?? 0)}{" "}
          <span className="text-sm font-normal text-muted-foreground">títulos</span>
        </>
      ),
    },
    {
      href: topScorer ? `/jogadores/${topScorer.id}` : "/jogadores/artilheiros",
      eyebrow: "Artilheiro histórico",
      title: topScorer?.name ?? "—",
      value: (
        <>
          {formatInt(topScorer?.goals ?? 0)}{" "}
          <span className="text-sm font-normal text-muted-foreground">gols</span>
        </>
      ),
      hint: "Ver ranking completo →",
    },
    {
      href: topApps ? `/jogadores/${topApps.id}` : "/jogadores/presencas",
      eyebrow: "Mais jogos",
      title: topApps?.name ?? "—",
      value: (
        <>
          {formatInt(topApps?.appearances ?? 0)}{" "}
          <span className="text-sm font-normal text-muted-foreground">jogos</span>
        </>
      ),
      hint: "Ver ranking completo →",
    },
    {
      href: topAssists ? `/jogadores/${topAssists.id}` : "/jogadores/assistencias",
      eyebrow: "Mais assistências",
      title: topAssists?.name ?? "—",
      value: (
        <>
          {formatInt(topAssists?.assists ?? 0)}{" "}
          <span className="text-sm font-normal text-muted-foreground">assistências</span>
        </>
      ),
      hint: "Ver ranking completo →",
    },
    {
      href: "/registros/sequencias/invencibilidade",
      eyebrow: "Maior sequência invicta",
      title: "Sem derrotas",
      value: (
        <>
          {formatInt(unbeaten?.length ?? 0)}{" "}
          <span className="text-sm font-normal text-muted-foreground">jogos</span>
        </>
      ),
    },
    {
      href: "/registros/sequencias/vitorias",
      eyebrow: "Maior sequência de vitórias",
      title: "Vitórias consecutivas",
      value: (
        <>
          {formatInt(winning?.length ?? 0)}{" "}
          <span className="text-sm font-normal text-muted-foreground">jogos</span>
        </>
      ),
    },
  ];

  return (
    <RecordsLayout
      title="Recordes Históricos"
      subtitle="Marcas individuais e coletivas do CSA — artilharia, jogos, títulos e sequências"
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded p-4 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => (
            <Link
              key={c.eyebrow}
              href={c.href}
              className="border rounded p-4 space-y-1 block hover:bg-muted/40 transition-colors"
              data-testid={`record-highlight-${c.eyebrow.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.eyebrow}</p>
              <p className="font-bold text-base truncate">{c.title}</p>
              <p className="text-2xl font-black text-primary">{c.value}</p>
              {c.hint && (
                <p className="text-xs text-primary/80 pt-1">{c.hint}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-6">
        Maiores vitórias e derrotas por placar ficam em{" "}
        <Link href="/partidas/recordes" className="text-primary hover:underline">
          Partidas → Maiores Vitórias &amp; Derrotas
        </Link>
        .
      </p>
    </RecordsLayout>
  );
}
