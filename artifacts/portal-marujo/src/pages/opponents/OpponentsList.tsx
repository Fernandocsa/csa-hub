import { useState } from "react";
import { Link } from "wouter";
import { useListOpponents } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function OpponentsList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useListOpponents({
    search: search.length > 2 ? search : undefined,
    limit,
    offset: (page - 1) * limit
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Adversários</h1>
        <p className="text-muted-foreground">Histórico de confrontos do CSA contra todos os adversários.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="w-full sm:w-72">
          <Input 
            placeholder="Buscar adversário..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adversário</TableHead>
              <TableHead className="text-right">J</TableHead>
              <TableHead className="text-right">V</TableHead>
              <TableHead className="text-right">E</TableHead>
              <TableHead className="text-right">D</TableHead>
              <TableHead className="text-right">GP</TableHead>
              <TableHead className="text-right">GC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Nenhum adversário encontrado.</TableCell>
              </TableRow>
            ) : (
              data?.data.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell className="font-bold">
                    <Link href={`/adversarios/${opp.id}`} className="text-primary hover:underline">
                      {opp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium">{opp.matches}</TableCell>
                  <TableCell className="text-right text-green-600">{opp.wins}</TableCell>
                  <TableCell className="text-right text-gray-500">{opp.draws}</TableCell>
                  <TableCell className="text-right text-destructive">{opp.losses}</TableCell>
                  <TableCell className="text-right">{opp.goalsFor}</TableCell>
                  <TableCell className="text-right">{opp.goalsAgainst}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > limit && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} até {Math.min(page * limit, data.total)} de {data.total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <Button variant="outline" disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}