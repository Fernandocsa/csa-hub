import { useGetHomeAwayRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Records() {
  const { data: records, isLoading } = useGetHomeAwayRecords({});

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Recordes Gerais</h1>
        <p className="text-muted-foreground">Desempenho histórico como mandante e visitante.</p>
      </div>

      {records && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle>Mandante</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground uppercase mb-1">Partidas</p>
                  <p className="text-3xl font-black">{records.home.matches}</p>
                </div>
                <div className="text-center p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground uppercase mb-1">Aproveitamento</p>
                  <p className="text-3xl font-black text-primary">
                    {((records.home.wins / (records.home.matches || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-green-600">{records.home.wins}</span>
                  <span className="text-xs text-muted-foreground">Vitórias</span>
                </div>
                <div className="text-center border-l border-r">
                  <span className="block text-2xl font-bold text-gray-500">{records.home.draws}</span>
                  <span className="text-xs text-muted-foreground">Empates</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-destructive">{records.home.losses}</span>
                  <span className="text-xs text-muted-foreground">Derrotas</span>
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center text-sm border-t pt-4">
                <div>Gols Pró: <span className="font-bold">{records.home.goalsFor}</span></div>
                <div>Gols Contra: <span className="font-bold text-destructive">{records.home.goalsAgainst}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted text-muted-foreground rounded-t-lg">
              <CardTitle>Visitante</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground uppercase mb-1">Partidas</p>
                  <p className="text-3xl font-black">{records.away.matches}</p>
                </div>
                <div className="text-center p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground uppercase mb-1">Aproveitamento</p>
                  <p className="text-3xl font-black text-primary">
                    {((records.away.wins / (records.away.matches || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-green-600">{records.away.wins}</span>
                  <span className="text-xs text-muted-foreground">Vitórias</span>
                </div>
                <div className="text-center border-l border-r">
                  <span className="block text-2xl font-bold text-gray-500">{records.away.draws}</span>
                  <span className="text-xs text-muted-foreground">Empates</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-destructive">{records.away.losses}</span>
                  <span className="text-xs text-muted-foreground">Derrotas</span>
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center text-sm border-t pt-4">
                <div>Gols Pró: <span className="font-bold">{records.away.goalsFor}</span></div>
                <div>Gols Contra: <span className="font-bold text-destructive">{records.away.goalsAgainst}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}