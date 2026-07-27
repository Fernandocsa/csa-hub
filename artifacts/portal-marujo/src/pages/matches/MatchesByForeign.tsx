import { Link } from "wouter";
import { useGetOpponentsByForeign } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default function MatchesByForeign() {
  const { data, isLoading, isError } = useGetOpponentsByForeign();

  const overall = data?.overall;
  const countries = data?.countries ?? [];
  const opponents = data?.opponents ?? [];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-csa-x-estrangeiros">
          CSA x Estrangeiros
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico agregado do CSA contra clubes estrangeiros
        </p>
      </div>

      {!isLoading && !isError && overall && (
        <>
          <div
            className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border rounded overflow-hidden"
            data-testid="foreign-stat-bar"
          >
            {[
              { label: "Partidas", value: overall.matches, highlight: true },
              { label: "Vitórias", value: overall.wins, color: "text-green-600" },
              { label: "Empates", value: overall.draws, color: "text-amber-600" },
              { label: "Derrotas", value: overall.losses, color: "text-red-600" },
              {
                label: "Aproveit.",
                value: pct(overall.wins, overall.matches),
                highlight: true,
              },
            ].map(({ label, value, color, highlight }) => (
              <div key={label} className="bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
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
              <p className="text-lg font-bold mt-0.5">{overall.opponentCount}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Países</p>
              <p className="text-lg font-bold mt-0.5">{countries.length}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols</p>
              <p className="text-lg font-bold mt-0.5">
                {overall.goalsFor}:{overall.goalsAgainst}
              </p>
            </div>
          </div>
        </>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError ? (
        <p className="text-destructive">Erro ao carregar histórico contra estrangeiros.</p>
      ) : opponents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum adversário estrangeiro com partidas oficiais.</p>
        </div>
      ) : (
        <>
          {countries.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm">
              {countries.map((c) => (
                <span
                  key={c.code}
                  className="inline-flex items-center gap-1.5 border rounded px-2.5 py-1 bg-muted/30"
                  data-testid={`chip-country-${c.code}`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {c.matches}J · {pct(c.wins, c.matches)}
                  </span>
                </span>
              ))}
            </div>
          )}

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
                {opponents.map((opp) => (
                  <TableRow key={opp.id} className="text-sm" data-testid={`row-foreign-${opp.id}`}>
                    <TableCell className="py-2 font-medium">
                      <Link
                        href={`/adversarios/${opp.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {opp.name}
                      </Link>
                      {opp.countryName && (
                        <span className="block text-xs text-muted-foreground">
                          {opp.countryName}
                        </span>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
