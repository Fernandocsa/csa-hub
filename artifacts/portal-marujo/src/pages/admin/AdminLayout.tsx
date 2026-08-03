import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Download,
  LogOut,
  ChevronLeft,
  CalendarDays,
  UserCog,
  CalendarRange,
  Landmark,
  MessageSquare,
  Flag,
  Scale,
  ClipboardList,
  BarChart3,
  Sparkles,
  Medal,
  Cake,
  Crown,
  Award,
  Star,
  ArrowLeftRight,
  Building2,
  FileText,
  Puzzle,
  AlertTriangle,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/useSiteTheme";
import "./admin-theme.css";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const navItems = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/divergencias", label: "Divergências", icon: AlertTriangle },
  { href: "/admin/jogadores", label: "Jogadores", icon: Users },
  { href: "/admin/tecnicos", label: "Técnicos", icon: UserCog },
  { href: "/admin/aniversariantes", label: "Aniversariantes", icon: Cake },
  { href: "/admin/temporadas", label: "Temporadas", icon: CalendarRange },
  { href: "/admin/partidas", label: "Partidas", icon: Trophy },
  { href: "/admin/recordes", label: "Recordes", icon: Award },
  { href: "/admin/titulos", label: "Títulos", icon: Crown },
  { href: "/admin/transferencias", label: "Transferências", icon: ArrowLeftRight },
  { href: "/admin/presidentes", label: "Presidentes", icon: Building2 },
  { href: "/admin/competicoes", label: "Competições", icon: Medal },
  { href: "/admin/adversarios", label: "Adversários", icon: Shield },
  { href: "/admin/arbitros", label: "Árbitros", icon: Scale },
  { href: "/admin/estadios", label: "Estádios", icon: Landmark },
  { href: "/admin/jogos-futuros", label: "Jogos futuros", icon: CalendarDays },
  { href: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/sugestoes", label: "Sugestões", icon: Flag },
  { href: "/admin/conteudo", label: "Texto da home", icon: FileText },
  { href: "/admin/quem-e-o-jogador", label: "Quem é o Jogador?", icon: Puzzle },
  { href: "/admin/partidas-duplicadas", label: "Revisão Partidas", icon: ClipboardList },
  { href: "/admin/importar-exportar", label: "Importar / Exportar", icon: Download },
  { href: "/admin/importar-ia", label: "Importação IA", icon: Sparkles },
  { href: "/admin/acessos", label: "Acessos", icon: BarChart3 },
];

function SidebarContent({
  location,
  onLogout,
  isDark,
  toggleTheme,
  onNavigate,
  onClose,
}: {
  location: string;
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="px-4 py-4 border-b border-white/10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg font-black tracking-tight">
            <span className="text-white">PORTAL</span>
            <span className="text-[#F5A623] ml-1">MARUJO</span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">Admin</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 shrink-0 -mr-1"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact
            ? location === item.href
            : location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors rounded w-full text-left"
          title={isDark ? "Usar tema claro" : "Usar tema escuro"}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
          {isDark ? "Tema claro" : "Tema escuro"}
        </button>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors rounded"
        >
          <ChevronLeft size={13} />
          Ver portal
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors rounded w-full text-left"
        >
          <LogOut size={13} />
          Sair
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({ children, onLogout }: Props) {
  const [location] = useLocation();
  const { theme, toggleTheme, isDark } = useAdminTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div
      className="admin-shell flex min-h-screen bg-gray-50 text-foreground"
      data-admin-theme={theme}
    >
      <aside className="hidden lg:flex lg:flex-col lg:w-52 lg:fixed lg:inset-y-0 bg-[#1B3A6B] z-30">
        <SidebarContent
          location={location}
          onLogout={onLogout}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
            aria-hidden
          />
          <aside className="relative z-50 flex flex-col w-64 max-w-[85vw] h-full bg-[#1B3A6B] shadow-xl">
            <SidebarContent
              location={location}
              onLogout={onLogout}
              isDark={isDark}
              toggleTheme={toggleTheme}
              onNavigate={closeMobile}
              onClose={closeMobile}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 lg:pl-52">
        <header className="sticky top-0 z-20 flex items-center gap-2 h-12 px-3 bg-[#1B3A6B] border-b border-white/10 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-white/80 hover:text-white p-1.5 -ml-1"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-black tracking-tight truncate">
            <span className="text-white">PORTAL</span>
            <span className="text-[#F5A623] ml-1">MARUJO</span>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-white/50 ml-1">
            Admin
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
