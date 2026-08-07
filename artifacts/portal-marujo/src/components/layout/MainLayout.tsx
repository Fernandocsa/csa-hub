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
  BookOpen,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";
import { SiteFooter } from "@/components/SiteFooter";
import { useSiteTheme } from "@/hooks/useSiteTheme";

type NavItem =
  | { name: string; href: string; icon: React.ElementType }
  | { name: string; icon: React.ElementType; children: { name: string; href: string }[] };

const navigation: NavItem[] = [
  { name: "Visão Geral", href: "/", icon: LayoutDashboard },
  {
    name: "Clube",
    icon: BookOpen,
    children: [
      { name: "Sobre o CSA", href: "/sobre" },
      { name: "Transferências", href: "/transferencias" },
      { name: "Presidentes", href: "/presidentes" },
      { name: "Contribua", href: "/sugestoes" },
    ],
  },
  {
    name: "Recordes",
    icon: Award,
    children: [
      { name: "Visão Geral", href: "/registros" },
      { name: "Títulos", href: "/titulos" },
      { name: "Por Competição", href: "/registros/competicao" },
      { name: "Por Década", href: "/registros/decada" },
      { name: "Sequências", href: "/registros/sequencias" },
      { name: "Mando de Campo", href: "/registros/mando" },
    ],
  },
  { name: "Competições", href: "/competicoes", icon: Medal },
  {
    name: "Partidas",
    icon: Swords,
    children: [
      { name: "Histórico de Partidas", href: "/partidas" },
      { name: "Amistosos", href: "/partidas/amistosos" },
      { name: "Sem Resultado", href: "/partidas/sem-resultado" },
      { name: "W.O.", href: "/partidas/wo" },
      { name: "Maiores Vitórias & Derrotas", href: "/partidas/recordes" },
      { name: "Maiores Públicos", href: "/publicos" },
      { name: "CSA x Estados", href: "/partidas/por-estado" },
      { name: "CSA x Estrangeiros", href: "/partidas/estrangeiros" },
      { name: "CSA x Regiões", href: "/partidas/por-regiao" },
    ],
  },
  { name: "Temporadas", href: "/temporadas", icon: CalendarDays },
  {
    name: "Jogadores",
    icon: Users,
    children: [
      { name: "Todos os Jogadores", href: "/jogadores" },
      { name: "Artilheiros", href: "/jogadores/artilheiros" },
      { name: "Mais Jogos", href: "/jogadores/presencas" },
      { name: "Assistências", href: "/jogadores/assistencias" },
      { name: "Emprestados", href: "/jogadores/emprestados" },
      { name: "Estrangeiros", href: "/jogadores/estrangeiros" },
      { name: "Por Estado", href: "/jogadores/por-estado" },
    ],
  },
  { name: "Técnicos", href: "/tecnicos", icon: Trophy },
  { name: "Adversários", href: "/adversarios", icon: Shield },
  { name: "Estádios", href: "/estadios", icon: MapPin },
  {
    name: "Árbitros",
    icon: Scale,
    children: [
      { name: "Todos os Árbitros", href: "/arbitros" },
      { name: "Por Estado", href: "/arbitros/por-estado" },
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

function SiteBrand({
  onClick,
  logoClassName,
  textClassName = "text-sm",
}: {
  onClick?: () => void;
  logoClassName: string;
  textClassName?: string;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2 min-w-0"
      aria-label="Portal Marujo — início"
    >
      <span
        className={cn(
          "font-black tracking-tight shrink-0 leading-none",
          textClassName,
        )}
      >
        <span className="text-white">PORTAL</span>
        <span className="text-[#F5A623] ml-1">MARUJO</span>
      </span>
      <img
        src="/portal-marujo-logo.png"
        alt=""
        className={cn(logoClassName, "object-contain cursor-pointer shrink-0")}
        data-testid="nav-logo"
      />
    </Link>
  );
}

function SidebarContent({
  location,
  onClose,
  themeToggle,
}: {
  location: string;
  onClose?: () => void;
  themeToggle?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 h-16 border-b border-sidebar-border flex-shrink-0 gap-1">
        <SiteBrand
          onClick={onClose}
          logoClassName="h-10 w-auto max-w-[5.5rem]"
          textClassName="text-xs sm:text-sm"
        />
        {onClose && (
          <button onClick={onClose} className="text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0 ml-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <NavLinks location={location} onClick={onClose} />
      </div>
      {themeToggle && (
        <div className="flex-shrink-0 border-t border-sidebar-border p-3">
          {themeToggle}
        </div>
      )}
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location === "/";
  const { isDark, toggleTheme } = useSiteTheme();

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      title={isDark ? "Usar tema claro" : "Usar tema escuro"}
      data-testid="button-theme-toggle"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? "Tema claro" : "Tema escuro"}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border z-30">
        <SidebarContent location={location} themeToggle={themeToggle} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border">
            <SidebarContent
              location={location}
              onClose={() => setMobileOpen(false)}
              themeToggle={themeToggle}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 lg:pl-56 min-w-0">
        <header className="sticky top-0 z-20 flex flex-col bg-sidebar border-b border-sidebar-border lg:hidden">
          <div className="h-12 flex items-center px-4 gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground mr-1 shrink-0"
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <SiteBrand
              logoClassName="h-8 w-auto max-w-[4.5rem]"
              textClassName="text-xs"
            />
            <button
              type="button"
              onClick={toggleTheme}
              className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground p-1.5 shrink-0"
              title={isDark ? "Tema claro" : "Tema escuro"}
              data-testid="button-theme-toggle-mobile"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          {!isHome && (
            <div className="px-3 pb-2.5">
              <GlobalSearch size="sm" />
            </div>
          )}
        </header>

        {!isHome && (
          <div className="hidden lg:block sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-2.5">
              <GlobalSearch size="sm" className="max-w-xl" />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
            <SiteFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
