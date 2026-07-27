import { Switch, Route } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminPlayers from "./AdminPlayers";
import AdminManagers from "./AdminManagers";
import AdminSeasons from "./AdminSeasons";
import AdminMatches from "./AdminMatches";
import AdminOpponents from "./AdminOpponents";
import AdminImportExport from "./AdminImportExport";
import AdminNextMatch from "./AdminNextMatch";
import AdminMatchSheet from "./AdminMatchSheet";

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
        <Route path="/admin/jogadores" component={AdminPlayers} />
        <Route path="/admin/tecnicos" component={AdminManagers} />
        <Route path="/admin/temporadas" component={AdminSeasons} />
        <Route path="/admin/partidas/:id/ficha" component={AdminMatchSheet} />
        <Route path="/admin/partidas" component={AdminMatches} />
        <Route path="/admin/adversarios" component={AdminOpponents} />
        <Route path="/admin/proximo-jogo" component={AdminNextMatch} />
        <Route path="/admin/importar-exportar" component={AdminImportExport} />
      </Switch>
    </AdminLayout>
  );
}
