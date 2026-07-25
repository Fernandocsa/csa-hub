import { useState } from "react";
import { Link } from "wouter";
import { useGetTopScorers, useListSeasons } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopScorers() {
  const [season, setSeason] = useState<string>("all");
  const { data: seasons } = useListSeasons();
  const { data: scorers, isLoading } = useGetTopScorers({
    season: season === "all" ? undefined : season,
    limit: 50,
  });

  return (
    <div className="space-y-5">
      <div className="border-b pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" data-testid="heading-artilheiros">Artilheiros Históricos</h1>
          <p className="text-sm text-muted-foreground">Ranking de goleadores do CSA em toda a história</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Temporada:</span>
          <Select value={season} onValueChange={(v) => setSeason(v)}>
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
              <TableHead className="py-2 text-right">Jogos</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Gols</TableHead>
              <TableHead className="py-2 text-right">Média</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : scorers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">Nenhum dado disponível.</TableCell>
                  </TableRow>
                )
              : scorers?.map((p, i) => {
                  const flag = (p as any).nationalityFlag as string | null | undefined;
                  return (
                    <TableRow key={p.id} className="text-sm" data-testid={`row-scorer-${p.id}`}>
                      <TableCell className="py-2 text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-baseline gap-0.5">
                          {flag && p.nationality !== "Brasil" && (
                            <span className="mr-0.5 text-base leading-none">{flag}</span>
                          )}
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs">{p.position ?? "–"}</TableCell>
                      <TableCell className="py-2 text-right">{p.appearances}</TableCell>
                      <TableCell className="py-2 text-right font-bold text-primary">{p.goals}</TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground">
                        {p.appearances > 0 ? (p.goals / p.appearances).toFixed(2) : "–"}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
