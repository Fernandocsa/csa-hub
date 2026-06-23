import { useListCompetitions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

export default function CompetitionsList() {
  const { data: competitions, isLoading } = useListCompetitions();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Competições</h1>
        <p className="text-muted-foreground">Histórico em todos os torneios disputados.</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competição</TableHead>
              <TableHead className="text-center">Títulos</TableHead>
              <TableHead className="text-right">Partidas</TableHead>
              <TableHead className="text-right">Vitórias</TableHead>
              <TableHead className="text-right">Empates</TableHead>
              <TableHead className="text-right">Derrotas</TableHead>
              <TableHead className="text-right">Última Edição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : competitions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Nenhuma competição encontrada.</TableCell>
              </TableRow>
            ) : (
              competitions?.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell className="font-bold">
                    <Link href={`/competicoes/${comp.id}`} className="text-primary hover:underline">
                      {comp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    {comp.titles ? (
                      <span className="inline-flex items-center justify-center gap-1 bg-accent/20 text-accent-foreground font-bold px-2 py-0.5 rounded-full">
                        <Trophy className="w-3 h-3 text-accent" /> {comp.titles}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{comp.matches}</TableCell>
                  <TableCell className="text-right text-green-600">{comp.wins}</TableCell>
                  <TableCell className="text-right text-gray-500">{comp.draws}</TableCell>
                  <TableCell className="text-right text-destructive">{comp.losses}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{comp.lastParticipation || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}