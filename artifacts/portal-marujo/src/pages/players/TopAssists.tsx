import { Link } from "wouter";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PlayerFlag } from "@/components/PlayerFlag";
import { useGetTopAssists, useListSeasons } from "@workspace/api-client-react";
import { useSeasonQueryParam } from "@/hooks/useSeasonQueryParam";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { assignCompetitionRanks } from "@/lib/competition-rank";

export default function TopAssists() {
  const { season, setSeason } = useSeasonQueryParam("/jogadores/assistencias");
  const { data: seasons } = useListSeasons();
  const { data: players, isLoading } = useGetTopAssists({
    limit: 100,
    season: season === "all" ? undefined : season,
  });
  const rows = players ?? [];
  const ranks = assignCompetitionRanks(rows, (p) => p.assists);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Mais Assistências</h1>
          <p className="text-sm text-muted-foreground">
            {season === "all"
              ? "Ranking histórico de jogadores com mais assistências pelo CSA"
              : `Assistências da temporada ${season}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Temporada:</span>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-32 h-8 text-sm" data-testid="select-season">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {seasons?.map((s) => (
                <SelectItem key={s.year} value={s.year}>
                  {s.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2 w-8">#</TableHead>
              <TableHead className="py-2">Jogador</TableHead>
              <TableHead className="py-2 hidden sm:table-cell">Posição</TableHead>
              <TableHead className="py-2 text-right hidden sm:table-cell">Jogos</TableHead>
              <TableHead className="py-2 text-right hidden sm:table-cell">Gols</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Assistências</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      Nenhum dado disponível.
                    </TableCell>
                  </TableRow>
                )
              : rows.map((p, i) => (
                    <TableRow key={p.id} className="text-sm">
                      <TableCell className="py-2 text-muted-foreground font-mono text-xs">
                        {ranks[i]}
                      </TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link
                          href={`/jogadores/${p.id}`}
                          className="hover:text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <PlayerFlag
                            flag={p.nationalityFlag}
                            nationality={p.nationality}
                          />
                          {p.name}
                          <VerifiedBadge status={(p as any).verificationStatus} />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">
                        {p.position ?? "–"}
                      </TableCell>
                      <TableCell className="py-2 text-right hidden sm:table-cell">
                        {p.appearances}
                      </TableCell>
                      <TableCell className="py-2 text-right hidden sm:table-cell">{p.goals}</TableCell>
                      <TableCell className="py-2 text-right font-bold text-primary">
                        {p.assists}
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
