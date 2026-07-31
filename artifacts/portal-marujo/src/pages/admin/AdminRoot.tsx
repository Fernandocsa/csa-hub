import { Switch, Route } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminPlayers from "./AdminPlayers";
import AdminPlayerDetail from "./AdminPlayerDetail";
import AdminManagers from "./AdminManagers";
import AdminManagerDetail from "./AdminManagerDetail";
import AdminSeasons from "./AdminSeasons";
import AdminSeasonDetail from "./AdminSeasonDetail";
import AdminMatches from "./AdminMatches";
import AdminOpponents from "./AdminOpponents";
import AdminOpponentDetail from "./AdminOpponentDetail";
import AdminReferees from "./AdminReferees";
import AdminRefereeDetail from "./AdminRefereeDetail";
import AdminCompetitions from "./AdminCompetitions";
import AdminCompetitionDetail from "./AdminCompetitionDetail";
import AdminStadiums from "./AdminStadiums";
import AdminStadiumDetail from "./AdminStadiumDetail";
import AdminImportExport from "./AdminImportExport";
import AdminAiImport from "./AdminAiImport";
import AdminAccesses from "./AdminAccesses";
import AdminUpcomingMatches from "./AdminUpcomingMatches";
import AdminMatchSheet from "./AdminMatchSheet";
import AdminMatchSheetRedirect from "./AdminMatchSheetRedirect";
import AdminMatchReview from "./AdminMatchReview";
import AdminComments from "./AdminComments";
import AdminSuggestions from "./AdminSuggestions";
import AdminBirthdays from "./AdminBirthdays";
import AdminRecords from "./AdminRecords";
import AdminTitles from "./AdminTitles";

export default function AdminRoot() {
  const { checked, authenticated, login, logout } = useAdminAuth();

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#1B3A6B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <AdminLayout onLogout={logout}>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/jogadores/novo" component={AdminPlayerDetail} />
        <Route path="/admin/jogadores/:id" component={AdminPlayerDetail} />
        <Route path="/admin/jogadores" component={AdminPlayers} />
        <Route path="/admin/tecnicos/novo" component={AdminManagerDetail} />
        <Route path="/admin/tecnicos/:id" component={AdminManagerDetail} />
        <Route path="/admin/tecnicos" component={AdminManagers} />
        <Route path="/admin/temporadas/:year" component={AdminSeasonDetail} />
        <Route path="/admin/temporadas" component={AdminSeasons} />
        <Route path="/admin/partidas/novo" component={AdminMatchSheet} />
        <Route path="/admin/partidas/:id/ficha" component={AdminMatchSheetRedirect} />
        <Route path="/admin/partidas/:id" component={AdminMatchSheet} />
        <Route path="/admin/partidas" component={AdminMatches} />
        <Route path="/admin/competicoes/novo" component={AdminCompetitionDetail} />
        <Route path="/admin/competicoes/:id" component={AdminCompetitionDetail} />
        <Route path="/admin/competicoes" component={AdminCompetitions} />
        <Route path="/admin/adversarios/novo" component={AdminOpponentDetail} />
        <Route path="/admin/adversarios/:id" component={AdminOpponentDetail} />
        <Route path="/admin/adversarios" component={AdminOpponents} />
        <Route path="/admin/arbitros/novo" component={AdminRefereeDetail} />
        <Route path="/admin/arbitros/:id" component={AdminRefereeDetail} />
        <Route path="/admin/arbitros" component={AdminReferees} />
        <Route path="/admin/estadios/novo" component={AdminStadiumDetail} />
        <Route path="/admin/estadios/:id" component={AdminStadiumDetail} />
        <Route path="/admin/estadios" component={AdminStadiums} />
        <Route path="/admin/aniversariantes" component={AdminBirthdays} />
        <Route path="/admin/recordes" component={AdminRecords} />
        <Route path="/admin/titulos" component={AdminTitles} />
        <Route path="/admin/proximo-jogo" component={AdminUpcomingMatches} />
        <Route path="/admin/jogos-futuros" component={AdminUpcomingMatches} />
        <Route path="/admin/comentarios" component={AdminComments} />
        <Route path="/admin/sugestoes" component={AdminSuggestions} />
        <Route path="/admin/partidas-duplicadas" component={AdminMatchReview} />
        <Route path="/admin/importar-exportar" component={AdminImportExport} />
        <Route path="/admin/importar-ia" component={AdminAiImport} />
        <Route path="/admin/acessos" component={AdminAccesses} />
      </Switch>
    </AdminLayout>
  );
}
