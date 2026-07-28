import { ExternalLink, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dashboard de Web Analytics do projeto na Vercel (Opção A — link externo). */
const VERCEL_ANALYTICS_URL =
  import.meta.env.VITE_VERCEL_ANALYTICS_URL?.trim() ||
  "https://vercel.com/fernandocsa/csa-hub/analytics";

export default function AdminAccesses() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Acessos</h1>
      <p className="text-sm text-gray-500 mb-6">
        Métricas de visitas e páginas mais vistas ficam no painel da Vercel Web Analytics.
      </p>

      <div className="bg-white border rounded-lg p-6 max-w-lg space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-[#1B3A6B]/10 p-2 shrink-0">
            <BarChart3 size={20} className="text-[#1B3A6B]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Vercel Web Analytics</p>
            <p className="text-sm text-gray-500 mt-1">
              Páginas mais visitadas, origem do tráfego, dispositivos e visitantes — direto no
              dashboard do projeto.
            </p>
          </div>
        </div>

        <Button asChild className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90">
          <a href={VERCEL_ANALYTICS_URL} target="_blank" rel="noopener noreferrer">
            Abrir Analytics na Vercel
            <ExternalLink size={14} className="ml-2" />
          </a>
        </Button>

        <p className="text-xs text-gray-400">
          Se o link não abrir o projeto certo, ajuste a variável{" "}
          <code className="text-gray-500">VITE_VERCEL_ANALYTICS_URL</code> no deploy.
        </p>
      </div>
    </div>
  );
}
