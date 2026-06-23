import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Visão Geral", href: "/registros" },
  { label: "Por Competição", href: "/registros/competicao" },
  { label: "Por Década", href: "/registros/decada" },
  { label: "Sequências", href: "/registros/sequencias" },
  { label: "Mando de Campo", href: "/registros/mando" },
];

export function RecordsLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const [location] = useLocation();
  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold" data-testid="heading-records">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-0 border-b overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = location === tab.href;
          return (
            <Link key={tab.href} href={tab.href}>
              <span
                className={cn(
                  "inline-block px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
                data-testid={`tab-${tab.href.replace(/\//g, "-")}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}
