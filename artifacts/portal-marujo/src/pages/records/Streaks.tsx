import { Link } from "wouter";
import { useGetStreaks } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";
import { formatDateBr } from "@/lib/utils";

function fmtDate(d: string) {
  return formatDateBr(d);
}

const typeConfig = {
  winning: {
    label: "Vitórias consecutivas",
    color: "text-green-600 dark:text-green-400",
    bg: "border-green-200 bg-green-50 dark:border-green-400/25 dark:bg-green-500/10",
    href: "/registros/sequencias/vitorias",
  },
  unbeaten: {
    label: "Jogos sem derrota",
    color: "text-primary",
    bg: "border-blue-200 bg-blue-50 dark:border-primary/30 dark:bg-primary/10",
    href: "/registros/sequencias/invencibilidade",
  },
  winless: {
    label: "Jogos sem vencer",
    color: "text-amber-600 dark:text-amber-400",
    bg: "border-amber-200 bg-amber-50 dark:border-amber-400/25 dark:bg-amber-500/10",
    href: "/registros/sequencias/sem-vencer",
  },
  losing: {
    label: "Derrotas consecutivas",
    color: "text-red-600 dark:text-red-400",
    bg: "border-red-200 bg-red-50 dark:border-red-400/25 dark:bg-red-500/10",
    href: "/registros/sequencias/derrotas",
  },
} as const;

function streakUi(type: string) {
  const key = type.trim().toLowerCase().replace(/_/g, "-");
  if (key === "winning" || key === "vitorias") return typeConfig.winning;
  if (key === "unbeaten" || key === "invencibilidade") return typeConfig.unbeaten;
  if (key === "winless" || key === "sem-vencer") return typeConfig.winless;
  if (key === "losing" || key === "derrotas") return typeConfig.losing;
  return null;
}

export default function Streaks() {
  const { data: streaks, isLoading } = useGetStreaks();

  return (
    <RecordsLayout title="Sequências Históricas" subtitle="Maiores sequências positivas e negativas do CSA">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded p-6">
              <Skeleton className="h-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {streaks?.map((streak, i) => {
            const cfg = streakUi(streak.type);
            const label =
              ("label" in streak && typeof streak.label === "string" && streak.label) ||
              cfg?.label ||
              "Sequência";
            const inner = (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p className={`text-4xl font-black ${cfg?.color ?? "text-foreground"}`}>
                      {streak.length}
                      <span className="text-base font-normal text-muted-foreground ml-2">jogos</span>
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      De{" "}
                      <span className="font-medium text-foreground">{fmtDate(streak.startDate)}</span>
                    </p>
                    <p>
                      Até{" "}
                      <span className="font-medium text-foreground">{fmtDate(streak.endDate)}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 border-t border-current/10 pt-3">
                  {streak.description}
                  {cfg?.href ? (
                    <span className="block mt-1 text-xs font-medium text-primary">
                      Ver jogos da sequência →
                    </span>
                  ) : null}
                </p>
              </>
            );
            return cfg?.href ? (
              <Link
                key={i}
                href={cfg.href}
                className={`border rounded p-5 block hover:opacity-95 dark:hover:opacity-100 transition-opacity ${cfg?.bg ?? "border bg-background"}`}
                data-testid={`streak-card-${streak.type}-${i}`}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={i}
                className={`border rounded p-5 ${cfg?.bg ?? "border bg-background"}`}
                data-testid={`streak-card-${streak.type}-${i}`}
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </RecordsLayout>
  );
}
