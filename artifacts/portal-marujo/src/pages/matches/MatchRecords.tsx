import { useGetBiggestVictories, useGetBiggestDefeats, useGetStreaks } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchRecords() {
  const { data: victories, isLoading: isLoadingV } = useGetBiggestVictories({ limit: 10 });
  const { data: defeats, isLoading: isLoadingD } = useGetBiggestDefeats({ limit: 10 });
  const { data: streaks, isLoading: isLoadingS } = useGetStreaks();

  const winningStreaks = streaks?.filter(s => s.type === "winning") || [];
  const unbeatenStreaks = streaks?.filter(s => s.type === "unbeaten") || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Recordes de Partidas</h1>
        <p className="text-muted-foreground">Maiores goleadas e sequências invictas da história.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Maiores Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adversário</TableHead>
                  <TableHead className="text-center">Placar</TableHead>
                  <TableHead>Ano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingV ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5" /></TableCell></TableRow>
                  ))
                ) : (
                  victories?.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">{match.opponent}</TableCell>
                      <TableCell className="text-center font-bold text-green-600">
                        {match.homeAway === 'home' ? match.goalsFor : match.goalsAgainst} - {match.homeAway === 'home' ? match.goalsAgainst : match.goalsFor}
                      </TableCell>
                      <TableCell>{match.date.substring(0, 4)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Maiores Derrotas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adversário</TableHead>
                  <TableHead className="text-center">Placar</TableHead>
                  <TableHead>Ano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingD ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5" /></TableCell></TableRow>
                  ))
                ) : (
                  defeats?.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">{match.opponent}</TableCell>
                      <TableCell className="text-center font-bold text-destructive">
                        {match.homeAway === 'home' ? match.goalsFor : match.goalsAgainst} - {match.homeAway === 'home' ? match.goalsAgainst : match.goalsFor}
                      </TableCell>
                      <TableCell>{match.date.substring(0, 4)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Maiores Sequências de Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Jogos</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingS ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5" /></TableCell></TableRow>
                  ))
                ) : (
                  winningStreaks.slice(0, 5).map((streak, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center font-black text-xl text-primary">{streak.length}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(streak.startDate).toLocaleDateString('pt-BR')} - {new Date(streak.endDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm">{streak.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maiores Sequências Invictas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Jogos</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingS ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5" /></TableCell></TableRow>
                  ))
                ) : (
                  unbeatenStreaks.slice(0, 5).map((streak, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center font-black text-xl text-primary">{streak.length}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(streak.startDate).toLocaleDateString('pt-BR')} - {new Date(streak.endDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm">{streak.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}