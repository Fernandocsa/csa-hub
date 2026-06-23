import { useState } from "react";
import { Link } from "wouter";
import { useListPlayers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function PlayersList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"appearances" | "goals" | "seasons">("appearances");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useListPlayers({
    search: search.length > 2 ? search : undefined,
    sort,
    limit,
    offset: (page - 1) * limit
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Jogadores Históricos</h1>
        <p className="text-muted-foreground">Todos os atletas que vestiram a camisa do CSA.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-72">
          <Input 
            placeholder="Buscar jogador..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select value={sort} onValueChange={(val: any) => { setSort(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appearances">Partidas</SelectItem>
              <SelectItem value="goals">Gols</SelectItem>
              <SelectItem value="seasons">Temporadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jogador</TableHead>
              <TableHead>Posição</TableHead>
              <TableHead className="text-right">Jogos</TableHead>
              <TableHead className="text-right">Gols</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Nenhum jogador encontrado.</TableCell>
              </TableRow>
            ) : (
              data?.data.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <Link href={`/jogadores/${player.id}`} className="hover:underline hover:text-primary">
                      {player.name}
                    </Link>
                  </TableCell>
                  <TableCell>{player.position || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{player.appearances}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{player.goals}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > limit && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} até Math.min(page * limit, data.total) de {data.total}
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