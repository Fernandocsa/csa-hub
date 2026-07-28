import { useState } from "react";
import { Link } from "wouter";
import { useListOpponents } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { OpponentCrest } from "@/components/OpponentCrest";
import { ListPagination } from "@/components/ListPagination";
import { LIST_PAGE_SIZE } from "@/lib/list-page";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

type SortKey = "matches" | "wins" | "goals";

export default function OpponentsList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("matches");
  const [page, setPage] = useState(1);
  const limit = LIST_PAGE_SIZE;

  const { data, isLoading } = useListOpponents({
    search: search.length > 1 ? search : undefined,
    sort,
    limit,
    offset: (page - 1) * limit,
  });

  const rows = data?.data ?? [];
  const ranks = assignCompetitionRanks(
    rows,
    (opp) => (sort === "wins" ? opp.wins : sort === "goals" ? opp.goalsFor : opp.matches),
    { startAt: (page - 1) * limit + 1 },
  );

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-adversarios">Adversários</h1>
        <p className="text-sm text-muted-foreground">Histórico do CSA contra cada adversário</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Buscar adversário..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-full sm:w-64 text-sm"
          data-testid="input-search-opponent"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
          <Select
            value={sort}
            onValueChange={(v: SortKey) => {
              setSort(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-sm" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matches">Jogos</SelectItem>
              <SelectItem value="wins">Vitórias</SelectItem>
              <SelectItem value="goals">Gols</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Adversário</TableHead>
              <TableHead className={`py-2 text-right ${sort === "matches" ? "text-primary font-bold" : ""}`}>J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className={`py-2 text-right ${sort === "goals" ? "text-primary font-bold" : ""}`}>GP</TableHead>
              <TableHead className="py-2 text-right">GC</TableHead>
              <TableHead className="py-2 text-right">Saldo</TableHead>
              <TableHead className="py-2 text-right">Aproveit.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-4" /></TableCell></TableRow>
                ))
              : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">Nenhum adversário encontrado.</TableCell>
                  </TableRow>
                )
              : rows.map((opp, i) => {
                  const gd = opp.goalsFor - opp.goalsAgainst;
                  return (
                    <TableRow key={opp.id} className="text-sm" data-testid={`row-opponent-${opp.id}`}>
                      <TableCell className="py-2 text-muted-foreground text-xs">{formatCompetitionRank(ranks[i])}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link
                          href={`/adversarios/${opp.id}`}
                          className="inline-flex items-center gap-2 hover:text-primary hover:underline"
                          data-testid={`link-opponent-${opp.id}`}
                        >
                          <OpponentCrest url={opp.logoUrl} name={opp.name} size="sm" />
                          {opp.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">{opp.matches}</TableCell>
                      <TableCell className="py-2 text-right text-green-600 font-medium">{opp.wins}</TableCell>
                      <TableCell className="py-2 text-right text-amber-600">{opp.draws}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">{opp.losses}</TableCell>
                      <TableCell className="py-2 text-right">{opp.goalsFor}</TableCell>
                      <TableCell className="py-2 text-right">{opp.goalsAgainst}</TableCell>
                      <TableCell className={`py-2 text-right text-xs font-medium ${gd >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {gd >= 0 ? "+" : ""}{gd}
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">{pct(opp.wins, opp.matches)}</TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {data && (
        <ListPagination
          page={page}
          pageSize={limit}
          total={data.total}
          onPageChange={setPage}
          label=" adversários"
        />
      )}
    </div>
  );
}
