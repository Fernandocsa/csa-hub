import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Swords,
  CalendarDays,
  Shield,
  Trophy,
  MapPin,
  Medal,
  Award,
  Scale,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem =
  | { name: string; href: string; icon: React.ElementType }
  | { name: string; icon: React.ElementType; children: { name: string; href: string }[] };

const navigation: NavItem[] = [
  { name: "Visão Geral", href: "/", icon: LayoutDashboard },
  {
    name: "Jogadores",
    icon: Users,
    children: [
      { name: "Todos os Jogadores", href: "/jogadores" },
      { name: "Artilheiros", href: "/jogadores/artilheiros" },
      { name: "Mais Jogos", href: "/jogadores/presencas" },
      { name: "Assistências", href: "/jogadores/assistencias" },
      { name: "Estrangeiros", href: "/jogadores/estrangeiros" },
      { name: "Por Estado", href: "/jogadores/por-estado" },
    ],
  },
  {
    name: "Partidas",
    icon: Swords,
    children: [
      { name: "Histórico de Partidas", href: "/partidas" },
      { name: "Maiores Vitórias & Derrotas", href: "/partidas/recordes" },
      { name: "Maiores Públicos", href: "/publicos" },
      { name: "CSA x Estados", href: "/partidas/por-estado" },
      { name: "CSA x Estrangeiros", href: "/partidas/estrangeiros" },
      { name: "CSA x Regiões", href: "/partidas/por-regiao" },
    ],
  },
  { name: "Temporadas", href: "/temporadas", icon: CalendarDays },
  { name: "Adversários", href: "/adversarios", icon: Shield },
  { name: "Técnicos", href: "/tecnicos", icon: Trophy },
  { name: "Árbitros", href: "/arbitros", icon: Scale },
  { name: "Competições", href: "/competicoes", icon: Medal },
  { name: "Estádios", href: "/estadios", icon: MapPin },
  {
    name: "Recordes",
    icon: Award,
    children: [
      { name: "Visão Geral", href: "/registros" },
      { name: "Por Competição", href: "/registros/competicao" },
      { name: "Por Década", href: "/registros/decada" },
      { name: "Sequências", href: "/registros/sequencias" },
      { name: "Mando de Campo", href: "/registros/mando" },
    ],
  },
];

function NavGroup({
  item,
  location,
  onClick,
}: {
  item: Extract<NavItem, { children: { name: string; href: string }[] }>;
  location: string;
  onClick?: () => void;
}) {
  const isAnyChildActive = item.children.some(
    (c) => location === c.href || location.startsWith(c.href + "/")
  );
  const [open, setOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isAnyChildActive
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
        data-testid={`nav-group-${item.name.toLowerCase().replace(/\s/g, "-")}`}
      >
        <span className="flex items-center gap-3">
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {item.name}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        )}
      </button>
      {open && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {item.children.map((child) => {
            const isActive = location === child.href;
            return (
              <Link key={child.href} href={child.href} onClick={onClick}>
                <span
                  className={cn(
                    "block px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                  data-testid={`nav-link-${child.href.replace(/\//g, "-")}`}
                >
                  {child.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavLinks({ location, onClick }: { location: string; onClick?: () => void }) {
  return (
    <nav className="space-y-0.5 px-2">
      {navigation.map((item) => {
        if ("children" in item) {
          return (
            <NavGroup
              key={item.name}
              item={item}
              location={location}
              onClick={onClick}
            />
          );
        }
        const isActive =
          item.href === "/"
            ? location === "/"
            : location === item.href || location.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} onClick={onClick}>
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              data-testid={`nav-link-${item.href.replace(/\//g, "-") || "home"}`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ location, onClose }: { location: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border flex-shrink-0">
        <Link href="/" onClick={onClose}>
          <span className="text-lg font-black tracking-tight leading-none cursor-pointer" data-testid="nav-logo">
            <span className="text-primary-foreground">PORTAL</span>
            <br />
            <span className="text-accent">MARUJO</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <NavLinks location={location} onClick={onClose} />
      </div>
      <div className="px-4 py-3 border-t border-sidebar-border flex-shrink-0">
        <p className="text-xs text-sidebar-foreground/40 leading-tight">
          A maior base estatística do CSA.
        </p>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border z-30">
        <SidebarContent location={location} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border">
            <SidebarContent location={location} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 lg:pl-56 min-w-0">
        <header className="sticky top-0 z-20 h-12 flex items-center px-4 bg-sidebar border-b border-sidebar-border lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground mr-3"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-black tracking-tight">
            <span className="text-primary-foreground">PORTAL</span>{" "}
            <span className="text-accent">MARUJO</span>
          </span>
        </header>

        <main className="flex-1 min-w-0">
          <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
