import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useListReferees } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ufDisplayName } from "@/lib/br-locations";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export default function RefereesList() {
  const { data: referees, isLoading } = useListReferees();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const all = referees ?? [];
    const q = norm(search);
    if (q.length < 1) return all;
    return all.filter((r) => {
      if (norm(r.name).includes(q)) return true;
      if (r.state && norm(r.state).includes(q)) return true;
      if (r.state && norm(ufDisplayName(r.state)).includes(q)) return true;
      return false;
    });
  }, [referees, search]);

  const ranks = assignCompetitionRanks(rows, (r) => r.matches);
  const { page, setPage, pageSize, total, slice, needsPagination, rankOffset } = useClientPage(rows);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-arbitros">
          Árbitros
        </h1>
        <p className="text-sm text-muted-foreground">
          Árbitros que apitaram jogos do CSA
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Buscar árbitro ou UF..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-full sm:w-64 text-sm"
          data-testid="input-search-referee"
        />
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">#</TableHead>
              <TableHead className="py-2">Árbitro</TableHead>
              <TableHead className="py-2 text-right">UF</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-600">V</TableHead>
              <TableHead className="py-2 text-right text-amber-600">E</TableHead>
              <TableHead className="py-2 text-right text-red-600">D</TableHead>
              <TableHead className="py-2 text-right">Aproveit.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
              : slice.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-20 text-center text-muted-foreground"
                    >
                      Nenhum árbitro encontrado.
                    </TableCell>
                  </TableRow>
                )
              : slice.map((r, i) => (
                  <TableRow key={r.id} className="text-sm" data-testid={`row-referee-${r.id}`}>
                    <TableCell className="py-2 text-muted-foreground text-xs">
                      {formatCompetitionRank(ranks[rankOffset + i])}
                    </TableCell>
                    <TableCell className="py-2 font-medium">
                      <Link
                        href={`/arbitros/${r.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {r.state ? `${r.state}` : "–"}
                      {r.state ? (
                        <span className="sr-only"> {ufDisplayName(r.state)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2 text-right">{r.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600 font-medium">
                      {r.wins}
                    </TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{r.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{r.losses}</TableCell>
                    <TableCell className="py-2 text-right font-bold text-primary">
                      {pct(r.wins, r.matches)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {needsPagination && (
        <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} label=" árbitros" />
      )}
    </div>
  );
}
