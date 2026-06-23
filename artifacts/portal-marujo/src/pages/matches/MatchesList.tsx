import { useState } from "react";
import { Link } from "wouter";
import { useListMatches } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function MatchesList() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useListMatches({
    limit,
    offset: (page - 1) * limit
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Banco de Partidas</h1>
        <p className="text-muted-foreground">Histórico completo de partidas do CSA.</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Adversário</TableHead>
              <TableHead className="text-center">Placar</TableHead>
              <TableHead>Competição</TableHead>
              <TableHead>Local</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Nenhuma partida encontrada.</TableCell>
              </TableRow>
            ) : (
              data?.data.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>{new Date(match.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">
                    {match.homeAway === 'home' ? (
                      <span className="text-primary font-bold">CSA</span>
                    ) : (
                      match.opponent
                    )}
                    {" x "}
                    {match.homeAway === 'away' ? (
                      <span className="text-primary font-bold">CSA</span>
                    ) : (
                      match.opponent
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {match.homeAway === 'home' ? match.goalsFor : match.goalsAgainst} - {match.homeAway === 'home' ? match.goalsAgainst : match.goalsFor}
                  </TableCell>
                  <TableCell>{match.competition}</TableCell>
                  <TableCell>{match.stadium || "-"}</TableCell>
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