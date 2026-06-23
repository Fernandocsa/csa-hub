import { useGetSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Swords, Goal, Users, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: summary, isLoading, isError } = useGetSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Visão Geral</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-8 text-center text-destructive">
        Erro ao carregar o resumo estatístico.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground">A maior base estatística do CSA.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jogos Oficiais</CardTitle>
            <Swords className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summary.totalMatches}</div>
            <p className="text-xs text-primary-foreground/80 mt-1">
              {summary.wins}V • {summary.draws}E • {summary.losses}D
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aproveitamento</CardTitle>
            <Trophy className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {summary.winPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De vitórias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gols Marcados</CardTitle>
            <Goal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{summary.goalsScored}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de {(summary.goalsScored / summary.totalMatches).toFixed(2)} por jogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gols Sofridos</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{summary.goalsConceded}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de {(summary.goalsConceded / summary.totalMatches).toFixed(2)} por jogo
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Destaques Históricos</h2>
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Jogador com Mais Partidas</p>
                  <p className="text-2xl font-bold">{summary.appearanceLeader.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">{summary.appearanceLeader.appearances}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Maior Artilheiro</p>
                  <p className="text-2xl font-bold">{summary.topScorer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">{summary.topScorer.goals}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Adversários Mais Comuns</h2>
          <Card>
            <div className="divide-y">
              {summary.mostCommonOpponents.slice(0, 5).map((opp, idx) => (
                <div key={opp.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}º</span>
                    <span className="font-semibold">{opp.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="font-bold text-lg">{opp.matches}</span>
                      <span className="text-xs text-muted-foreground ml-1">jogos</span>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block w-24 text-right">
                      {opp.wins}V {opp.draws}E {opp.losses}D
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}