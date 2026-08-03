import { Link } from "wouter";
import { useGetMatchMilestones } from "@workspace/api-client-react";
import { formatDateBr } from "@/lib/utils";

export function SiteFooter() {
  const { data: milestones } = useGetMatchMilestones();
  const year = new Date().getFullYear();
  const lastMatchDate = milestones?.last?.date ?? null;
  const lastLabel = lastMatchDate
    ? formatDateBr(lastMatchDate, { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <footer
      className="mt-10 border-t border-border pt-6 pb-8 text-sm text-muted-foreground"
      data-testid="site-footer"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="font-medium text-foreground">Portal Marujo</p>
          <p className="text-xs leading-relaxed max-w-md">
            Base estatística do Centro Sportivo Alagoano. Dados em constante
            atualização a partir de fontes históricas e oficiais.
          </p>
          {lastLabel && (
            <p className="text-xs" data-testid="footer-last-match">
              Última partida catalogada: {lastLabel}
            </p>
          )}
        </div>
        <div className="text-xs space-y-1 sm:text-right">
          <p>
            <Link href="/" className="hover:text-primary hover:underline">
              Início
            </Link>
            {" · "}
            <Link href="/jogadores" className="hover:text-primary hover:underline">
              Jogadores
            </Link>
            {" · "}
            <Link href="/partidas" className="hover:text-primary hover:underline">
              Partidas
            </Link>
            {" · "}
            <Link href="/registros" className="hover:text-primary hover:underline">
              Recordes
            </Link>
            {" · "}
            <Link href="/quem-e-o-jogador" className="hover:text-primary hover:underline">
              Quem é o Jogador?
            </Link>
            {" · "}
            <Link href="/sugestoes" className="hover:text-primary hover:underline">
              Contribua
            </Link>
          </p>
          <p>© {year} Portal Marujo</p>
        </div>
      </div>
    </footer>
  );
}
