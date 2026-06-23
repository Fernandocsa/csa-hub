import { useListStadiums } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function StadiumsList() {
  const { data: stadiums, isLoading } = useListStadiums();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Estádios</h1>
        <p className="text-muted-foreground">Desempenho histórico do CSA em cada praça esportiva.</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estádio</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Jogos</TableHead>
              <TableHead className="text-right">Vitórias</TableHead>
              <TableHead className="text-right">Empates</TableHead>
              <TableHead className="text-right">Derrotas</TableHead>
              <TableHead className="text-right">Aproveitamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : stadiums?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Nenhum estádio encontrado.</TableCell>
              </TableRow>
            ) : (
              stadiums?.map((stadium) => {
                const winPct = (((stadium.wins + (stadium.draws * 0.5)) / (stadium.matches || 1)) * 100).toFixed(1);
                // using standard pts format or simple win %
                const justWinPct = ((stadium.wins / (stadium.matches || 1)) * 100).toFixed(1);
                
                return (
                  <TableRow key={stadium.id}>
                    <TableCell className="font-bold text-foreground">{stadium.name}</TableCell>
                    <TableCell className="text-muted-foreground">{stadium.city || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{stadium.matches}</TableCell>
                    <TableCell className="text-right text-green-600">{stadium.wins}</TableCell>
                    <TableCell className="text-right text-gray-500">{stadium.draws}</TableCell>
                    <TableCell className="text-right text-destructive">{stadium.losses}</TableCell>
                    <TableCell className="text-right font-bold">{justWinPct}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}