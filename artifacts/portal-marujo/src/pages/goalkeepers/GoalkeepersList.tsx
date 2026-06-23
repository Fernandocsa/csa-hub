import { Link } from "wouter";
import { useListGoalkeepers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function GoalkeepersList() {
  const { data: goalkeepers, isLoading } = useListGoalkeepers({});

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-goleiros">Goleiros</h1>
        <p className="text-sm text-muted-foreground">Estatísticas dos paredões que defenderam a meta azulina</p>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Goleiro</TableHead>
              <TableHead className="py-2 text-right">Partidas</TableHead>
              <TableHead className="py-2 text-right">Gols Sofridos</TableHead>
              <TableHead className="py-2 text-right">Média GS/J</TableHead>
              <TableHead className="py-2 text-right">Clean Sheets</TableHead>
              <TableHead className="py-2 text-right">% CS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4" /></TableCell></TableRow>
                ))
              : goalkeepers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">Nenhum goleiro encontrado.</TableCell>
                  </TableRow>
                )
              : goalkeepers?.map((gk, i) => {
                  const avg = gk.matches > 0 ? (gk.goalsConceeded / gk.matches).toFixed(2) : "–";
                  const csPct = gk.matches > 0 ? ((gk.cleanSheets / gk.matches) * 100).toFixed(1) + "%" : "–";
                  return (
                    <TableRow key={gk.id} className="text-sm" data-testid={`row-gk-${gk.id}`}>
                      <TableCell className="py-2 text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link href={`/jogadores/${gk.id}`} className="hover:text-primary hover:underline" data-testid={`link-gk-${gk.id}`}>
                          {gk.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-bold text-primary">{gk.matches}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">{gk.goalsConceeded}</TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground">{avg}</TableCell>
                      <TableCell className="py-2 text-right font-bold">{gk.cleanSheets}</TableCell>
                      <TableCell className="py-2 text-right font-medium">{csPct}</TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
