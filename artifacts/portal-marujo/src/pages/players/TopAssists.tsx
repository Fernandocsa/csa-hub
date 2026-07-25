import { Link } from "wouter";
import { useGetTopAssists } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopAssists() {
  const { data: players, isLoading } = useGetTopAssists(100);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold">Mais Assistências</h1>
        <p className="text-sm text-muted-foreground">Ranking histórico de jogadores com mais assistências pelo CSA</p>
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
                    <TableCell colSpan={6}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : players?.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      Nenhum dado disponível.
                    </TableCell>
                  </TableRow>
                )
                : players?.map((p, i) => {
                    const flag = p.nationalityFlag as string | null | undefined;
                    return (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="py-2 text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                        <TableCell className="py-2 font-medium">
                          <Link href={`/jogadores/${p.id}`} className="hover:text-primary hover:underline inline-flex items-baseline gap-0.5">
                            {flag && p.nationality !== "Brasil" && (
                              <span className="mr-0.5 text-base leading-none">{flag}</span>
                            )}
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">{p.position ?? "–"}</TableCell>
                        <TableCell className="py-2 text-right hidden sm:table-cell">{p.appearances}</TableCell>
                        <TableCell className="py-2 text-right hidden sm:table-cell">{p.goals}</TableCell>
                        <TableCell className="py-2 text-right font-bold text-primary">{p.assists}</TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
