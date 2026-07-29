import { Link, useParams } from "wouter";
import { useGetOpponentsByStateDetail } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { ufDisplayName } from "@/lib/br-locations";
import { OpponentCrest } from "@/components/OpponentCrest";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default function MatchesByStateDetail() {
  const params = useParams<{ uf: string }>();
  const uf = params.uf ?? "";
  const isUnknown = uf.toLowerCase() === "sem-estado";
  const { data, isLoading, isError } = useGetOpponentsByStateDetail(uf);

  const title = isUnknown
    ? "Sem estado"
    : data?.state
      ? `CSA x times de ${ufDisplayName(data.state)}`
      : `CSA x ${uf.toUpperCase()}`;

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 max-w-4xl">
        <Link href="/partidas/por-estado">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> CSA x Estados
          </span>
        </Link>
        <p className="text-destructive">Estado não encontrado ou inválido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/partidas/por-estado">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back-states"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> CSA x Estados
        </span>
      </Link>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold" data-testid="heading-state-detail">
          {title}
        </h1>
        {!isUnknown && data.state && (
          <p className="text-sm text-muted-foreground mt-1">{data.state}</p>
        )}
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border rounded overflow-hidden"
        data-testid="state-stat-bar"
      >
        {[
          { label: "Partidas", value: data.matches, highlight: true },
          { label: "Vitórias", value: data.wins, color: "text-green-600" },
          { label: "Empates", value: data.draws, color: "text-amber-600" },
          { label: "Derrotas", value: data.losses, color: "text-red-600" },
          {
            label: "Aproveit.",
            value: pct(data.wins, data.matches),
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Times</p>
          <p className="text-lg font-bold mt-0.5">{data.opponentCount}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols pró</p>
          <p className="text-lg font-bold mt-0.5">{data.goalsFor}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols contra</p>
          <p className="text-lg font-bold mt-0.5">{data.goalsAgainst}</p>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Adversário</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-700">V</TableHead>
              <TableHead className="py-2 text-right text-amber-700">E</TableHead>
              <TableHead className="py-2 text-right text-red-700">D</TableHead>
              <TableHead className="py-2 text-right">Gols</TableHead>
              <TableHead className="py-2 text-right">Apr.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.opponents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                  Nenhum time neste filtro.
                </TableCell>
              </TableRow>
            ) : (
              data.opponents.map((opp) => (
                <TableRow key={opp.id} className="text-sm" data-testid={`row-opp-${opp.id}`}>
                  <TableCell className="py-2 font-medium">
                    <Link
                      href={`/adversarios/${opp.id}`}
                      className="inline-flex items-center gap-2 hover:text-primary hover:underline"
                    >
                      <OpponentCrest url={opp.logoUrl} name={opp.name} size="sm" />
                      {opp.name}
                    </Link>
                    {opp.city && (
                      <span className="block text-xs text-muted-foreground">{opp.city}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold">{opp.matches}</TableCell>
                  <TableCell className="py-2 text-right text-green-600">{opp.wins}</TableCell>
                  <TableCell className="py-2 text-right text-amber-600">{opp.draws}</TableCell>
                  <TableCell className="py-2 text-right text-red-600">{opp.losses}</TableCell>
                  <TableCell className="py-2 text-right text-muted-foreground">
                    {opp.goalsFor}:{opp.goalsAgainst}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {pct(opp.wins, opp.matches)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
