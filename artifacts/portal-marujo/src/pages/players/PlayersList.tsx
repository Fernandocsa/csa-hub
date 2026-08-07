import { useState } from "react";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PlayerFlag } from "@/components/PlayerFlag";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { useListPlayers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ListPagination } from "@/components/ListPagination";
import { LIST_PAGE_SIZE } from "@/lib/list-page";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

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
  const limit = LIST_PAGE_SIZE;

  const { data, isLoading } = useListPlayers({
    search: search.length > 1 ? search : undefined,
    sort,
    limit,
    offset: (page - 1) * limit,
  });

  const rows = data?.data ?? [];
  const ranks = assignCompetitionRanks(
    rows,
    (player) =>
      sort === "goals"
        ? player.goals
        : sort === "seasons"
          ? player.seasons
          : player.appearances,
    { startAt: (page - 1) * limit + 1 },
  );

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-jogadores">Todos os Jogadores</h1>
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
              : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">Nenhum jogador encontrado.</TableCell>
                  </TableRow>
                )
              : rows.map((player, i) => (
                    <TableRow key={player.id} className="text-sm" data-testid={`row-player-${player.id}`}>
                      <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[i])}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link href={`/jogadores/${player.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-2 min-w-0" data-testid={`link-player-${player.id}`}>
                          <PlayerPhoto
                            url={player.photoUrl}
                            name={player.name}
                            size="sm"
                            className="h-7 w-7 text-[9px]"
                          />
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <PlayerFlag
                              flag={(player as { nationalityFlag?: string | null }).nationalityFlag}
                              nationality={player.nationality}
                              showBrazil={false}
                            />
                            <span className="truncate">{player.name}</span>
                            <VerifiedBadge status={(player as any).verificationStatus} />
                          </span>
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
                  ))}
          </TableBody>
        </Table>
      </div>

      {data && (
        <ListPagination
          page={page}
          pageSize={limit}
          total={data.total}
          onPageChange={setPage}
          label=" jogadores"
        />
      )}
    </div>
  );
}
