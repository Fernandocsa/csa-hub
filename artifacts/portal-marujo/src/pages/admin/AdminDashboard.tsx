import { useCallback, useEffect, useState } from "react";
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
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Summary {
  totalMatches: number;
  totalPlayers: number;
  totalOpponents: number;
}

type DashboardTab = "overview" | "divergences";

type DivergenceItem = {
  id: number;
  name: string;
  href: string;
  summary: string;
};

type DivergenceGroup = {
  kind: string;
  entityType: "player" | "manager";
  title: string;
  description: string;
  count: number;
  items: DivergenceItem[];
};

const sections = [
  { href: "/admin/jogadores", label: "Jogadores", icon: Users, desc: "Cadastrar e editar jogadores e estatísticas por temporada" },
  { href: "/admin/tecnicos", label: "Técnicos", icon: UserCog, desc: "Badges manuais dos técnicos" },
  { href: "/admin/aniversariantes", label: "Aniversariantes", icon: Cake, desc: "Jogadores e técnicos que fazem aniversário no dia" },
  { href: "/admin/temporadas", label: "Temporadas", icon: CalendarRange, desc: "Verificação de stats e badges Artilheiro/Garçom" },
  { href: "/admin/partidas", label: "Partidas", icon: Trophy, desc: "Adicionar e editar partidas do histórico" },
  { href: "/admin/competicoes", label: "Competições", icon: Medal, desc: "Criar, editar, excluir e mesclar competições" },
  { href: "/admin/adversarios", label: "Adversários", icon: Shield, desc: "Gerenciar adversários cadastrados" },
  { href: "/admin/arbitros", label: "Árbitros", icon: Scale, desc: "Cadastrar árbitros e federação (UF)" },
  { href: "/admin/jogos-futuros", label: "Jogos futuros", icon: CalendarDays, desc: "Agendar partidas futuras; o mais próximo aparece na Home" },
  { href: "/admin/partidas-duplicadas", label: "Revisão Partidas", icon: ClipboardList, desc: "Sem resultado, ficha incompleta/vazia e sem técnico" },
  { href: "/admin/importar-exportar", label: "Importar / Exportar", icon: Download, desc: "Importar dados via CSV ou exportar para planilha" },
  { href: "/admin/importar-ia", label: "Importação IA", icon: Sparkles, desc: "Extrair lote de temporada com Claude e confirmar na prévia" },
  { href: "/admin/acessos", label: "Acessos", icon: BarChart3, desc: "Abrir o dashboard de Web Analytics na Vercel" },
];

function EntityBadge({ type }: { type: "player" | "manager" }) {
  return (
    <span
      className={`text-[11px] px-1.5 py-0.5 rounded border ${
        type === "player"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-violet-50 text-violet-700 border-violet-200"
      }`}
    >
      {type === "player" ? "Jogador" : "Técnico"}
    </span>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<DivergenceGroup[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [divLoading, setDivLoading] = useState(false);
  const [divError, setDivError] = useState<string | null>(null);
  const [divLoaded, setDivLoaded] = useState(false);

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
  }, []);

  const loadDivergences = useCallback(async () => {
    setDivLoading(true);
    setDivError(null);
    try {
      const res = await adminFetch("/admin/data-divergences");
      if (!res.ok) throw new Error("Falha ao carregar divergências");
      const data = await res.json();
      setGroups(data.groups ?? []);
      setTotalItems(data.totalItems ?? 0);
      setDivLoaded(true);
    } catch (e) {
      setDivError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setDivLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "divergences" && !divLoaded && !divLoading) {
      loadDivergences();
    }
  }, [tab, divLoaded, divLoading, loadDivergences]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Painel de Administração</h1>
      <p className="text-sm text-gray-500 mb-4">Gerencie os dados do Portal Marujo</p>

      <div className="flex gap-1 mb-6 border-b">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "overview"
              ? "border-[#1B3A6B] text-[#1B3A6B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Visão geral
        </button>
        <button
          type="button"
          onClick={() => setTab("divergences")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
            tab === "divergences"
              ? "border-[#1B3A6B] text-[#1B3A6B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <AlertTriangle size={14} />
          Divergências
          {divLoaded && (
            <span className="text-xs text-gray-400">({totalItems})</span>
          )}
        </button>
      </div>

      {tab === "overview" ? (
        <>
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
        </>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500">
                Possíveis inconsistências em jogadores e técnicos detectadas automaticamente.
                A revisão de partidas (datas duplicadas) continua em{" "}
                <Link href="/admin/partidas-duplicadas" className="text-[#1B3A6B] hover:underline">
                  Revisão Partidas
                </Link>
                .
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadDivergences} disabled={divLoading}>
              <RefreshCw size={14} className={`mr-1.5 ${divLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {divError && <p className="text-sm text-red-600 mb-4">{divError}</p>}

          {divLoading && !divLoaded ? (
            <p className="text-sm text-gray-400">Detectando divergências...</p>
          ) : groups.length === 0 ? (
            <div className="bg-white border rounded-lg px-4 py-10 text-center text-sm text-gray-400">
              Nenhuma divergência detectada.
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <section key={g.kind} className="border rounded-lg overflow-hidden bg-gray-50/80">
                  <header className="px-4 py-2.5 bg-white border-b space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{g.title}</h2>
                      <EntityBadge type={g.entityType} />
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {g.count} {g.count === 1 ? "item" : "itens"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{g.description}</p>
                  </header>
                  <div className="p-3 grid gap-2 sm:grid-cols-2">
                    {g.items.map((item, idx) => (
                      <Link
                        key={`${g.kind}-${item.id}-${idx}`}
                        href={item.href}
                        className="block border rounded-lg bg-white p-3 hover:border-[#1B3A6B]/40 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-[#1B3A6B] truncate">{item.name}</p>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                            #{item.id}
                            <ExternalLink size={11} />
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.summary}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
