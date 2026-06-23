import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Trophy, Shield, Download, LogOut, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const navItems = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/jogadores", label: "Jogadores", icon: Users },
  { href: "/admin/partidas", label: "Partidas", icon: Trophy },
  { href: "/admin/adversarios", label: "Adversários", icon: Shield },
  { href: "/admin/importar-exportar", label: "Importar / Exportar", icon: Download },
];

export default function AdminLayout({ children, onLogout }: Props) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-52 bg-[#1B3A6B] flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="text-lg font-black tracking-tight">
            <span className="text-white">PORTAL</span>
            <span className="text-[#F5A623] ml-1">MARUJO</span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors rounded"
          >
            <ChevronLeft size={13} />
            Ver portal
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors rounded w-full text-left"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
