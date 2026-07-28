import { Link, useParams } from "wouter";
import { useGetStadiumDetail } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function StadiumDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data: stadium, isLoading, isError } = useGetStadiumDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !stadium) {
    return (
      <div className="space-y-3 max-w-3xl">
        <Link href="/estadios">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Estádios
          </span>
        </Link>
        <p className="text-destructive">Estádio não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/estadios">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Estádios
        </span>
      </Link>

      <div className="border-b pb-4">
        <div className="inline-flex items-center gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-stadium">
            {stadium.name}
          </h1>
          <ShareButton title={stadium.name} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {[
            stadium.city,
            stadium.state,
            stadium.capacity != null
              ? `Capacidade ${stadium.capacity.toLocaleString("pt-BR")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Desempenho histórico do CSA neste estádio"}
        </p>
        {stadium.homeClubs && stadium.homeClubs.length > 0 && (
          <p className="text-sm mt-2">
            <span className="text-muted-foreground">Sede de: </span>
            {stadium.homeClubs.map((club, i) => (
              <span key={club.id}>
                {i > 0 ? ", " : ""}
                <Link
                  href={`/adversarios/${club.id}`}
                  className="text-primary hover:underline"
                >
                  {club.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <div
        className="grid grid-cols-5 gap-px bg-border rounded overflow-hidden"
        data-testid="stadium-stat-bar"
      >
        {[
          { label: "Partidas", value: stadium.matches, highlight: true },
          { label: "Vitórias", value: stadium.wins, color: "text-green-600" },
          { label: "Empates", value: stadium.draws, color: "text-amber-600" },
          { label: "Derrotas", value: stadium.losses, color: "text-red-600" },
          {
            label: "Aproveit.",
            value: pct(stadium.wins, stadium.matches),
            highlight: true,
          },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p
              className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols pró</p>
          <p className="text-lg font-bold mt-0.5">{stadium.goalsScored}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols contra</p>
          <p className="text-lg font-bold mt-0.5">{stadium.goalsConceded}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">1ª partida</p>
          <p className="text-lg font-bold mt-0.5">
            {stadium.firstMatch ? fmtDate(stadium.firstMatch) : "–"}
          </p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Última partida</p>
          <p className="text-lg font-bold mt-0.5">
            {stadium.lastMatch ? fmtDate(stadium.lastMatch) : "–"}
          </p>
        </div>
      </div>
    </div>
  );
}
