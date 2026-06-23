import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Swords,
  Trophy,
  CalendarDays,
  Shield,
  MapPin,
  Medal,
  Award,
  TrendingUp,
  History,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Visão Geral", href: "/", icon: LayoutDashboard },
  { name: "Jogadores", href: "/jogadores", icon: Users },
  { name: "Partidas", href: "/partidas", icon: Swords },
  { name: "Temporadas", href: "/temporadas", icon: CalendarDays },
  { name: "Adversários", href: "/adversarios", icon: Shield },
  { name: "Técnicos", href: "/tecnicos", icon: Trophy },
  { name: "Goleiros", href: "/goleiros", icon: Shield },
  { name: "Estádios", href: "/estadios", icon: MapPin },
  { name: "Competições", href: "/competicoes", icon: Medal },
  { name: "Recordes da História", href: "/registros", icon: Award },
];

function NavLinks({ className, onClick }: { className?: string; onClick?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className={cn("space-y-1", className)}>
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.name} href={item.href} onClick={onClick}>
            <span
              className={cn(
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors"
              )}
            >
              <item.icon
                className={cn(
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                  "flex-shrink-0 -ml-1 mr-3 h-5 w-5"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-border bg-sidebar pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-6">
          <span className="text-2xl font-bold tracking-tight text-primary uppercase">PORTAL<br/><span className="text-accent">MARUJO</span></span>
        </div>
        <div className="mt-8 flex-1 h-0 overflow-y-auto px-4">
          <NavLinks />
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-sidebar border-b border-border lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="px-4 border-r border-border focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden">
            <span className="sr-only">Abrir menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <div className="pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-6">
              <span className="text-2xl font-bold tracking-tight text-primary uppercase">PORTAL<br/><span className="text-accent">MARUJO</span></span>
            </div>
            <div className="mt-8 px-4">
              <NavLinks />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <span className="text-lg font-bold tracking-tight text-primary uppercase">PORTAL MARUJO</span>
        </div>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full lg:w-0">
        <MobileNav />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}