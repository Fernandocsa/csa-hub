import { Switch, Route, useLocation } from "wouter";
import { MainLayout } from "./components/layout/MainLayout";
import Home from "./pages/Home";
import PlayersList from "./pages/players/PlayersList";
import PlayerDetail from "./pages/players/PlayerDetail";
import TopScorers from "./pages/players/TopScorers";
import TopAppearances from "./pages/players/TopAppearances";
import MatchesList from "./pages/matches/MatchesList";
import MatchRecords from "./pages/matches/MatchRecords";
import SeasonsList from "./pages/seasons/SeasonsList";
import SeasonDetail from "./pages/seasons/SeasonDetail";
import OpponentsList from "./pages/opponents/OpponentsList";
import OpponentDetail from "./pages/opponents/OpponentDetail";
import ManagersList from "./pages/managers/ManagersList";
import ManagerDetail from "./pages/managers/ManagerDetail";
import StadiumsList from "./pages/stadiums/StadiumsList";
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
        <Route path="/jogadores/:id" component={PlayerDetail} />
        <Route path="/partidas" component={MatchesList} />
        <Route path="/partidas/recordes" component={MatchRecords} />
        <Route path="/temporadas" component={SeasonsList} />
        <Route path="/temporadas/:year" component={SeasonDetail} />
        <Route path="/adversarios" component={OpponentsList} />
        <Route path="/adversarios/:id" component={OpponentDetail} />
        <Route path="/tecnicos" component={ManagersList} />
        <Route path="/tecnicos/:id" component={ManagerDetail} />
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
