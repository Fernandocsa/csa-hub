import { useGetStreaks } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordsLayout } from "./RecordsLayout";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

const typeConfig = {
  winning: { label: "Vitórias Consecutivas", color: "text-green-600", bg: "border-green-200 bg-green-50" },
  unbeaten: { label: "Jogos Sem Derrota", color: "text-primary", bg: "border-blue-200 bg-blue-50" },
  losing: { label: "Derrotas Consecutivas", color: "text-red-600", bg: "border-red-200 bg-red-50" },
};

export default function Streaks() {
  const { data: streaks, isLoading } = useGetStreaks();

  return (
    <RecordsLayout title="Sequências Históricas" subtitle="Maiores sequências positivas e negativas do CSA">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded p-6"><Skeleton className="h-20" /></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {streaks?.map((streak, i) => {
            const cfg = typeConfig[streak.type as keyof typeof typeConfig] ?? { label: streak.type, color: "text-foreground", bg: "border bg-background" };
            return (
              <div key={i} className={`border rounded p-5 ${cfg.bg}`} data-testid={`streak-card-${streak.type}-${i}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{cfg.label}</p>
                    <p className={`text-4xl font-black ${cfg.color}`}>
                      {streak.length}
                      <span className="text-base font-normal text-muted-foreground ml-2">jogos</span>
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>De <span className="font-medium text-foreground">{fmtDate(streak.startDate)}</span></p>
                    <p>Até <span className="font-medium text-foreground">{fmtDate(streak.endDate)}</span></p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 border-t border-current/10 pt-3">{streak.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </RecordsLayout>
  );
}
