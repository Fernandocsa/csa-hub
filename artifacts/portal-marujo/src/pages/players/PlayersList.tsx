import { useState } from "react";
import { Link } from "wouter";
import { useListPlayers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type SortKey = "appearances" | "goals" | "seasons";

const sortLabels: Record<SortKey, string> = {
  appearances: "Partidas",
  goals: "Gols",
  seasons: "Temporadas",
};

export default function PlayersList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("appearances");
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data, isLoading } = useListPlayers({
    search: search.length > 1 ? search : undefined,
    sort,
    limit,
    offset: (page - 1) * limit,
  });

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-jogadores">Banco de Jogadores</h1>
        <p className="text-sm text-muted-foreground">Todos os atletas que vestiram a camisa do CSA</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-64 h-8 text-sm"
          data-testid="input-search-player"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
          <Select value={sort} onValueChange={(v: SortKey) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-8 text-sm" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appearances">Partidas</SelectItem>
              <SelectItem value="goals">Gols</SelectItem>
              <SelectItem value="seasons">Temporadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Jogador</TableHead>
              <TableHead className="py-2">Posição</TableHead>
              <TableHead className="py-2 text-right">Temporadas</TableHead>
              <TableHead className={`py-2 text-right ${sort === "appearances" ? "text-primary font-bold" : ""}`}>Jogos</TableHead>
              <TableHead className={`py-2 text-right ${sort === "goals" ? "text-primary font-bold" : ""}`}>Gols</TableHead>
              <TableHead className="py-2 text-right">Média/Jogo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">Nenhum jogador encontrado.</TableCell>
                  </TableRow>
                )
              : data?.data.map((player, i) => {
                  const flag = (player as any).nationalityFlag as string | null | undefined;
                  return (
                    <TableRow key={player.id} className="text-sm" data-testid={`row-player-${player.id}`}>
                      <TableCell className="py-2 text-muted-foreground text-xs">{(page - 1) * limit + i + 1}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link href={`/jogadores/${player.id}`} className="hover:text-primary hover:underline inline-flex items-baseline gap-0.5" data-testid={`link-player-${player.id}`}>
                          {flag && player.nationality !== "Brasil" && (
                            <span className="mr-0.5 text-base leading-none">{flag}</span>
                          )}
                          {player.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs">{player.position ?? "–"}</TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground">{player.seasons ?? "–"}</TableCell>
                      <TableCell className={`py-2 text-right font-medium ${sort === "appearances" ? "text-primary" : ""}`}>{player.appearances}</TableCell>
                      <TableCell className={`py-2 text-right font-medium ${sort === "goals" ? "text-primary" : ""}`}>{player.goals}</TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground text-xs">
                        {player.appearances > 0 ? (player.goals / player.appearances).toFixed(2) : "–"}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {data && data.total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} de {data.total} jogadores
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} data-testid="button-prev">Anterior</Button>
            <Button variant="outline" size="sm" disabled={page * limit >= data.total} onClick={() => setPage((p) => p + 1)} data-testid="button-next">Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}
