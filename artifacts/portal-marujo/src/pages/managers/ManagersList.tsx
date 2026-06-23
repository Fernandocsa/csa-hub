import { useListManagers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagersList() {
  const { data: managers, isLoading } = useListManagers();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Técnicos</h1>
        <p className="text-muted-foreground">Histórico de treinadores que comandaram o CSA.</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Treinador</TableHead>
              <TableHead className="text-right">J</TableHead>
              <TableHead className="text-right">V</TableHead>
              <TableHead className="text-right">E</TableHead>
              <TableHead className="text-right">D</TableHead>
              <TableHead className="text-right">%</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : managers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Nenhum técnico encontrado.</TableCell>
              </TableRow>
            ) : (
              managers?.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell className="font-bold">
                    <Link href={`/tecnicos/${manager.id}`} className="text-primary hover:underline">
                      {manager.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium">{manager.matches}</TableCell>
                  <TableCell className="text-right text-green-600">{manager.wins}</TableCell>
                  <TableCell className="text-right text-gray-500">{manager.draws}</TableCell>
                  <TableCell className="text-right text-destructive">{manager.losses}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {manager.winPercentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}