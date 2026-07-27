import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Users, Trophy, Shield, Download, CalendarDays } from "lucide-react";

interface Summary {
  totalMatches: number;
  totalPlayers: number;
  totalOpponents: number;
}

const sections = [
  { href: "/admin/jogadores", label: "Jogadores", icon: Users, desc: "Cadastrar e editar jogadores e estatísticas por temporada" },
  { href: "/admin/partidas", label: "Partidas", icon: Trophy, desc: "Adicionar e editar partidas do histórico" },
  { href: "/admin/adversarios", label: "Adversários", icon: Shield, desc: "Gerenciar adversários cadastrados" },
  { href: "/admin/proximo-jogo", label: "Próximo Jogo", icon: CalendarDays, desc: "Editar o card Próxima Partida da Home" },
  { href: "/admin/importar-exportar", label: "Importar / Exportar", icon: Download, desc: "Importar dados via CSV ou exportar para planilha" },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch("/admin/matches?limit=1").then((r) => r.json()),
      adminFetch("/admin/players").then((r) => r.json()),
      adminFetch("/admin/opponents").then((r) => r.json()),
    ]).then(([matches, players, opponents]) => {
      setSummary({
        totalMatches: matches.total ?? 0,
        totalPlayers: Array.isArray(players) ? players.length : 0,
        totalOpponents: Array.isArray(opponents) ? opponents.length : 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Painel de Administração</h1>
      <p className="text-sm text-gray-500 mb-6">Gerencie os dados do Portal Marujo</p>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Partidas", value: summary.totalMatches },
            { label: "Jogadores", value: summary.totalPlayers },
            { label: "Adversários", value: summary.totalOpponents },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1B3A6B] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white border rounded-lg p-5 hover:border-[#1B3A6B] hover:shadow-sm transition-all block"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className="text-[#1B3A6B]" />
              <span className="font-semibold text-gray-900">{s.label}</span>
            </div>
            <p className="text-sm text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
