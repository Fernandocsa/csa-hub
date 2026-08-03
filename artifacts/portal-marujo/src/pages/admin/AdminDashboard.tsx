import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import {
  Users,
  Trophy,
  Shield,
  Download,
  CalendarDays,
  CalendarRange,
  UserCog,
  Scale,
  ClipboardList,
  BarChart3,
  Sparkles,
  Medal,
  Cake,
  ArrowLeftRight,
  Building2,
  FileText,
} from "lucide-react";
import { AdminHomeTabs } from "./AdminHomeTabs";

interface Summary {
  totalMatches: number;
  totalPlayers: number;
  totalOpponents: number;
}

const sections = [
  { href: "/admin/conteudo", label: "Texto da home", icon: FileText, desc: "Editar o título e o texto de introdução da página inicial" },
  { href: "/admin/jogadores", label: "Jogadores", icon: Users, desc: "Cadastrar e editar jogadores e estatísticas por temporada" },
  { href: "/admin/tecnicos", label: "Técnicos", icon: UserCog, desc: "Badges manuais dos técnicos" },
  { href: "/admin/aniversariantes", label: "Aniversariantes", icon: Cake, desc: "Jogadores e técnicos que fazem aniversário no dia" },
  { href: "/admin/temporadas", label: "Temporadas", icon: CalendarRange, desc: "Verificação de stats e badges Artilheiro/Garçom" },
  { href: "/admin/partidas", label: "Partidas", icon: Trophy, desc: "Adicionar e editar partidas do histórico" },
  { href: "/admin/transferencias", label: "Transferências", icon: ArrowLeftRight, desc: "Chegadas e saídas por temporada" },
  { href: "/admin/presidentes", label: "Presidentes", icon: Building2, desc: "Mandatos e fotos dos presidentes do clube" },
  { href: "/admin/competicoes", label: "Competições", icon: Medal, desc: "Criar, editar, excluir e mesclar competições" },
  { href: "/admin/adversarios", label: "Adversários", icon: Shield, desc: "Gerenciar adversários cadastrados" },
  { href: "/admin/arbitros", label: "Árbitros", icon: Scale, desc: "Cadastrar árbitros e federação (UF)" },
  { href: "/admin/jogos-futuros", label: "Jogos futuros", icon: CalendarDays, desc: "Agendar partidas futuras; o mais próximo aparece na Home" },
  { href: "/admin/partidas-duplicadas", label: "Revisão Partidas", icon: ClipboardList, desc: "Sem resultado, ficha incompleta/vazia e sem técnico" },
  { href: "/admin/importar-exportar", label: "Importar / Exportar", icon: Download, desc: "Importar dados via CSV ou exportar para planilha" },
  { href: "/admin/importar-ia", label: "Importação IA", icon: Sparkles, desc: "Extrair lote de temporada com Claude e confirmar na prévia" },
  { href: "/admin/acessos", label: "Acessos", icon: BarChart3, desc: "Abrir o dashboard de Web Analytics na Vercel" },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [divergenceCount, setDivergenceCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch("/admin/matches?limit=1").then((r) => r.json()),
      adminFetch("/admin/players").then((r) => r.json()),
      adminFetch("/admin/opponents").then((r) => r.json()),
    ])
      .then(([matches, players, opponents]) => {
        setSummary({
          totalMatches: matches.total ?? 0,
          totalPlayers: Array.isArray(players) ? players.length : 0,
          totalOpponents: Array.isArray(opponents) ? opponents.length : 0,
        });
      })
      .catch(() => {});

    adminFetch("/admin/data-divergences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.totalItems === "number") {
          setDivergenceCount(data.totalItems);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Painel de Administração</h1>
      <p className="text-sm text-gray-500 mb-4">Gerencie os dados do Portal Marujo</p>

      <AdminHomeTabs divergenceCount={divergenceCount} />

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Partidas", value: summary.totalMatches },
            { label: "Jogadores", value: summary.totalPlayers },
            { label: "Adversários", value: summary.totalOpponents },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
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
