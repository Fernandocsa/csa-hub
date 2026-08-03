import { useEffect } from "react";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PlayerFlag } from "@/components/PlayerFlag";
import { useGetTopAppearances, useListSeasons } from "@workspace/api-client-react";
import { useSeasonQueryParam } from "@/hooks/useSeasonQueryParam";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

export default function TopAppearances() {
  const { season, setSeason } = useSeasonQueryParam("/jogadores/presencas");
  const { data: seasons } = useListSeasons();
  const { data: players, isLoading } = useGetTopAppearances({
    season: season === "all" ? undefined : season,
    limit: 100,
  });
  const rows = players ?? [];
  const ranks = assignCompetitionRanks(rows, (p) => p.appearances);
  const { page, setPage, pageSize, total, slice, needsPagination, rankOffset } = useClientPage(rows);

  useEffect(() => {
    setPage(1);
  }, [season, setPage]);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" data-testid="heading-presencas">Mais Jogos</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            {season === "all"
              ? "Ranking de jogadores com mais partidas pelo CSA na base do Portal Marujo — não é o ranking absoluto da história do clube."
              : `Mais jogos da temporada ${season} na base do Portal Marujo.`}
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
                <SelectItem key={s.year} value={s.year}>{s.year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2 w-10">#</TableHead>
              <TableHead className="py-2">Jogador</TableHead>
              <TableHead className="py-2">Posição</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Jogos</TableHead>
              <TableHead className="py-2 text-right">Gols</TableHead>
              <TableHead className="py-2 text-right">Temporadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : slice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">Nenhum dado disponível.</TableCell>
                  </TableRow>
                )
              : slice.map((p, i) => (
                    <TableRow key={p.id} className="text-sm" data-testid={`row-appearances-${p.id}`}>
                      <TableCell className="py-2 text-muted-foreground font-mono text-xs">{formatCompetitionRank(ranks[rankOffset + i])}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                          <PlayerFlag
                            flag={(p as { nationalityFlag?: string | null }).nationalityFlag}
                            nationality={p.nationality}
                            showBrazil={false}
                          />
                          {p.name}
                          <VerifiedBadge status={(p as any).verificationStatus} />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs">{p.position ?? "–"}</TableCell>
                      <TableCell className="py-2 text-right font-bold text-primary">{p.appearances}</TableCell>
                      <TableCell className="py-2 text-right">{p.goals}</TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground">{p.seasons ?? "–"}</TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </div>

      {needsPagination && (
        <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
