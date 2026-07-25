import { CheckCircle2, Shield } from "lucide-react";

const SOURCES = [
  "OGol",
  "RSSSF Brasil",
  "Blog do Sorrentino",
  "jogosdocsa.wordpress.com",
  "Federação Alagoana de Futebol (FAF)",
  "Confederação Brasileira de Futebol (CBF)",
  "Acervo da Gazeta de Alagoas",
  "Acervo do Jornal de Alagoas",
  "Acervo da Tribuna de Alagoas",
  "Hemeroteca Digital Brasileira (Biblioteca Nacional)",
  "GE / Globo Esporte (quando aplicável)",
  "Arquivos oficiais do CSA",
  "Súmulas oficiais",
  "Conferência manual jogo a jogo",
];

interface VerificationCardProps {
  status?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export function VerificationCard({ status, verifiedBy, verifiedAt }: VerificationCardProps) {
  if (status !== "verified") return null;

  const dateStr = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Verificação das Estatísticas</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Verificado</span>
            {verifiedBy && (
              <span className="text-xs text-emerald-600/70 dark:text-emerald-500">
                — por {verifiedBy}{dateStr ? ` em ${dateStr}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sources */}
      <div>
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Fontes utilizadas</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {SOURCES.map((src) => (
            <li key={src} className="flex items-start gap-1.5 text-xs text-emerald-700/80 dark:text-emerald-400/80">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
              {src}
            </li>
          ))}
        </ul>
      </div>

      {/* Statement */}
      <p className="text-xs text-emerald-700/70 dark:text-emerald-400/60 border-t border-emerald-200 dark:border-emerald-800 pt-3 leading-relaxed">
        Todas as estatísticas apresentadas nesta página foram revisadas manualmente utilizando múltiplas fontes históricas independentes. Quando necessário, divergências entre fontes foram analisadas individualmente até a confirmação dos dados.
      </p>
    </div>
  );
}
