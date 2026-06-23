import { useGetOpponent } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function OpponentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: opponent, isLoading, isError } = useGetOpponent(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !opponent) {
    return <div className="text-center p-8 text-destructive">Erro ao carregar adversário.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/adversarios">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Adversários
        </Button>
      </Link>

      <h1 className="text-4xl font-bold text-foreground">CSA x {opponent.name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium opacity-80 uppercase">Jogos</p>
            <p className="text-4xl font-black mt-2">{opponent.matches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Vitórias</p>
            <p className="text-4xl font-black text-green-600 mt-2">{opponent.wins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Empates</p>
            <p className="text-4xl font-black text-gray-500 mt-2">{opponent.draws}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase">Derrotas</p>
            <p className="text-4xl font-black text-destructive mt-2">{opponent.losses}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {opponent.homeRecord && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Como Mandante</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-center">
                  <span className="block text-2xl font-bold">{opponent.homeRecord.matches}</span>
                  <span className="text-xs text-muted-foreground">J</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-green-600">{opponent.homeRecord.wins}</span>
                  <span className="text-xs text-muted-foreground">V</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-gray-500">{opponent.homeRecord.draws}</span>
                  <span className="text-xs text-muted-foreground">E</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-destructive">{opponent.homeRecord.losses}</span>
                  <span className="text-xs text-muted-foreground">D</span>
                </div>
              </CardContent>
            </Card>
          )}

          {opponent.awayRecord && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Como Visitante</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-center">
                  <span className="block text-2xl font-bold">{opponent.awayRecord.matches}</span>
                  <span className="text-xs text-muted-foreground">J</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-green-600">{opponent.awayRecord.wins}</span>
                  <span className="text-xs text-muted-foreground">V</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-gray-500">{opponent.awayRecord.draws}</span>
                  <span className="text-xs text-muted-foreground">E</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-destructive">{opponent.awayRecord.losses}</span>
                  <span className="text-xs text-muted-foreground">D</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Confrontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opponent.recentMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-muted rounded-md text-sm">
                  <span className="w-16">{new Date(match.date).getFullYear()}</span>
                  <span className="flex-1 text-center font-bold">
                    {match.homeAway === 'home' ? 'CSA' : match.opponent} {match.homeAway === 'home' ? match.goalsFor : match.goalsAgainst} - {match.homeAway === 'home' ? match.goalsAgainst : match.goalsFor} {match.homeAway === 'away' ? 'CSA' : match.opponent}
                  </span>
                  <span className="w-24 text-right text-muted-foreground">{match.competition}</span>
                </div>
              ))}
              {opponent.recentMatches.length === 0 && (
                <p className="text-muted-foreground text-center">Nenhum confronto recente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}