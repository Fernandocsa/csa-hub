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
import LoanedPlayers from "./pages/players/LoanedPlayers";
import NationalityDetail from "./pages/players/NationalityDetail";
import PlayersByState from "./pages/players/PlayersByState";
import PlayersByStateDetail from "./pages/players/PlayersByStateDetail";
import MatchesList from "./pages/matches/MatchesList";
import MatchesFriendlies from "./pages/matches/MatchesFriendlies";
import MatchesUnknown from "./pages/matches/MatchesUnknown";
import MatchesWalkovers from "./pages/matches/MatchesWalkovers";
import MatchRecords from "./pages/matches/MatchRecords";
import MatchDetail from "./pages/matches/MatchDetail";
import Publicos from "./pages/matches/Publicos";
import MatchesByState from "./pages/matches/MatchesByState";
import MatchesByStateDetail from "./pages/matches/MatchesByStateDetail";
import MatchesByForeign from "./pages/matches/MatchesByForeign";
import MatchesByRegion from "./pages/matches/MatchesByRegion";
import MatchesByRegionDetail from "./pages/matches/MatchesByRegionDetail";
import SeasonsList from "./pages/seasons/SeasonsList";
import SeasonDetail from "./pages/seasons/SeasonDetail";
import OpponentsList from "./pages/opponents/OpponentsList";
import OpponentDetail from "./pages/opponents/OpponentDetail";
import ManagersList from "./pages/managers/ManagersList";
import ManagerDetail from "./pages/managers/ManagerDetail";
import ManagerMatches from "./pages/managers/ManagerMatches";
import RefereesList from "./pages/referees/RefereesList";
import RefereeDetail from "./pages/referees/RefereeDetail";
import RefereesByState from "./pages/referees/RefereesByState";
import RefereesByStateDetail from "./pages/referees/RefereesByStateDetail";
import StadiumsList from "./pages/stadiums/StadiumsList";
import StadiumDetail from "./pages/stadiums/StadiumDetail";
import CompetitionsList from "./pages/competitions/CompetitionsList";
import CompetitionDetail from "./pages/competitions/CompetitionDetail";
import Records from "./pages/records/Records";
import ByDecade from "./pages/records/ByDecade";
import ByCompetition from "./pages/records/ByCompetition";
import Streaks from "./pages/records/Streaks";
import StreakWinning from "./pages/records/StreakWinning";
import StreakUnbeaten from "./pages/records/StreakUnbeaten";
import StreakLosing from "./pages/records/StreakLosing";
import StreakWinless from "./pages/records/StreakWinless";
import Titles from "./pages/records/Titles";
import HomeAway from "./pages/records/HomeAway";
import TransfersList from "./pages/transfers/TransfersList";
import PresidentsList from "./pages/presidents/PresidentsList";
import AboutCsa from "./pages/club/AboutCsa";
import ClassicoPage from "./pages/club/Classico";
import Contribua from "./pages/club/Contribua";
import QuemEOjogadorPage from "./pages/games/QuemEOjogador";
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
        <Route path="/jogadores/emprestados" component={LoanedPlayers} />
        <Route path="/jogadores/estrangeiros" component={Estrangeiros} />
        <Route path="/jogadores/estrangeiros/:country" component={NationalityDetail} />
        <Route path="/jogadores/por-estado/:uf" component={PlayersByStateDetail} />
        <Route path="/jogadores/por-estado" component={PlayersByState} />
        <Route path="/jogadores/:id/jogos" component={PlayerMatches} />
        <Route path="/jogadores/:id" component={PlayerDetail} />
        <Route path="/partidas/recordes" component={MatchRecords} />
        <Route path="/partidas/amistosos" component={MatchesFriendlies} />
        <Route path="/partidas/sem-resultado" component={MatchesUnknown} />
        <Route path="/partidas/wo" component={MatchesWalkovers} />
        <Route path="/partidas/por-estado/:uf" component={MatchesByStateDetail} />
        <Route path="/partidas/por-estado" component={MatchesByState} />
        <Route path="/partidas/estrangeiros" component={MatchesByForeign} />
        <Route path="/partidas/por-regiao/:slug" component={MatchesByRegionDetail} />
        <Route path="/partidas/por-regiao" component={MatchesByRegion} />
        <Route path="/partidas/:id" component={MatchDetail} />
        <Route path="/partidas" component={MatchesList} />
        <Route path="/publicos" component={Publicos} />
        <Route path="/temporadas" component={SeasonsList} />
        <Route path="/temporadas/:year" component={SeasonDetail} />
        <Route path="/adversarios" component={OpponentsList} />
        <Route path="/adversarios/:id" component={OpponentDetail} />
        <Route path="/tecnicos" component={ManagersList} />
        <Route path="/tecnicos/:id/jogos" component={ManagerMatches} />
        <Route path="/tecnicos/:id" component={ManagerDetail} />
        <Route path="/arbitros/por-estado/:uf" component={RefereesByStateDetail} />
        <Route path="/arbitros/por-estado" component={RefereesByState} />
        <Route path="/arbitros" component={RefereesList} />
        <Route path="/arbitros/:id" component={RefereeDetail} />
        <Route path="/estadios/:id" component={StadiumDetail} />
        <Route path="/estadios" component={StadiumsList} />
        <Route path="/competicoes" component={CompetitionsList} />
        <Route path="/competicoes/:id" component={CompetitionDetail} />
        <Route path="/titulos" component={Titles} />
        <Route path="/registros" component={Records} />
        <Route path="/registros/competicao" component={ByCompetition} />
        <Route path="/registros/decada" component={ByDecade} />
        <Route path="/registros/sequencias/vitorias" component={StreakWinning} />
        <Route path="/registros/sequencias/invencibilidade" component={StreakUnbeaten} />
        <Route path="/registros/sequencias/derrotas" component={StreakLosing} />
        <Route path="/registros/sequencias/sem-vencer" component={StreakWinless} />
        <Route path="/registros/sequencias" component={Streaks} />
        <Route path="/registros/mando" component={HomeAway} />
        <Route path="/transferencias" component={TransfersList} />
        <Route path="/presidentes" component={PresidentsList} />
        <Route path="/sobre" component={AboutCsa} />
        <Route path="/sobre-o-csa" component={AboutCsa} />
        <Route path="/contribua" component={Contribua} />
        <Route path="/sugestoes" component={Contribua} />
        <Route path="/quem-e-o-jogador" component={QuemEOjogadorPage} />
        <Route path="/classico" component={ClassicoPage} />
        <Route path="/csa-x-crb" component={ClassicoPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}
