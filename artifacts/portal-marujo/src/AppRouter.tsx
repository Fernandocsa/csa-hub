import { Switch, Route, useLocation } from "wouter";
import { MainLayout } from "./components/layout/MainLayout";
import Home from "./pages/Home";
import PlayersList from "./pages/players/PlayersList";
import PlayerDetail from "./pages/players/PlayerDetail";
import PlayerMatches from "./pages/players/PlayerMatches";
import TopScorers from "./pages/players/TopScorers";
import TopAppearances from "./pages/players/TopAppearances";
import TopAssists from "./pages/players/TopAssists";
import Estrangeiros from "./pages/players/Estrangeiros";
import NationalityDetail from "./pages/players/NationalityDetail";
import PlayersByState from "./pages/players/PlayersByState";
import PlayersByStateDetail from "./pages/players/PlayersByStateDetail";
import MatchesList from "./pages/matches/MatchesList";
import MatchRecords from "./pages/matches/MatchRecords";
import MatchDetail from "./pages/matches/MatchDetail";
import Publicos from "./pages/matches/Publicos";
import MatchesByState from "./pages/matches/MatchesByState";
import MatchesByStateDetail from "./pages/matches/MatchesByStateDetail";
import SeasonsList from "./pages/seasons/SeasonsList";
import SeasonDetail from "./pages/seasons/SeasonDetail";
import OpponentsList from "./pages/opponents/OpponentsList";
import OpponentDetail from "./pages/opponents/OpponentDetail";
import ManagersList from "./pages/managers/ManagersList";
import ManagerDetail from "./pages/managers/ManagerDetail";
import StadiumsList from "./pages/stadiums/StadiumsList";
import StadiumDetail from "./pages/stadiums/StadiumDetail";
import CompetitionsList from "./pages/competitions/CompetitionsList";
import CompetitionDetail from "./pages/competitions/CompetitionDetail";
import Records from "./pages/records/Records";
import ByDecade from "./pages/records/ByDecade";
import ByCompetition from "./pages/records/ByCompetition";
import Streaks from "./pages/records/Streaks";
import HomeAway from "./pages/records/HomeAway";
import AdminRoot from "./pages/admin/AdminRoot";
import NotFound from "./pages/not-found";

export default function AppRouter() {
  const [location] = useLocation();

  if (location.startsWith("/admin")) {
    return <AdminRoot />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/jogadores" component={PlayersList} />
        <Route path="/jogadores/artilheiros" component={TopScorers} />
        <Route path="/jogadores/presencas" component={TopAppearances} />
        <Route path="/jogadores/assistencias" component={TopAssists} />
        <Route path="/jogadores/estrangeiros" component={Estrangeiros} />
        <Route path="/jogadores/estrangeiros/:country" component={NationalityDetail} />
        <Route path="/jogadores/por-estado/:uf" component={PlayersByStateDetail} />
        <Route path="/jogadores/por-estado" component={PlayersByState} />
        <Route path="/jogadores/:id/jogos" component={PlayerMatches} />
        <Route path="/jogadores/:id" component={PlayerDetail} />
        <Route path="/partidas/recordes" component={MatchRecords} />
        <Route path="/partidas/por-estado/:uf" component={MatchesByStateDetail} />
        <Route path="/partidas/por-estado" component={MatchesByState} />
        <Route path="/partidas/:id" component={MatchDetail} />
        <Route path="/partidas" component={MatchesList} />
        <Route path="/publicos" component={Publicos} />
        <Route path="/temporadas" component={SeasonsList} />
        <Route path="/temporadas/:year" component={SeasonDetail} />
        <Route path="/adversarios" component={OpponentsList} />
        <Route path="/adversarios/:id" component={OpponentDetail} />
        <Route path="/tecnicos" component={ManagersList} />
        <Route path="/tecnicos/:id" component={ManagerDetail} />
        <Route path="/estadios/:id" component={StadiumDetail} />
        <Route path="/estadios" component={StadiumsList} />
        <Route path="/competicoes" component={CompetitionsList} />
        <Route path="/competicoes/:id" component={CompetitionDetail} />
        <Route path="/registros" component={Records} />
        <Route path="/registros/competicao" component={ByCompetition} />
        <Route path="/registros/decada" component={ByDecade} />
        <Route path="/registros/sequencias" component={Streaks} />
        <Route path="/registros/mando" component={HomeAway} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}
