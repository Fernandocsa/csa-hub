import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== "verified") return null;

  const dateStr = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 select-none hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Verificado
      </button>

      {open && (
        <div className="absolute z-20 left-0 mt-2 w-[min(100vw-2rem,24rem)] sm:w-[28rem] rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 shadow-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Verificação das Estatísticas
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Verificado
                </span>
                {verifiedBy && (
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-500">
                    — por {verifiedBy}
                    {dateStr ? ` em ${dateStr}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
              Fontes utilizadas
            </p>
            <ul className="grid grid-cols-1 gap-y-1 max-h-40 overflow-y-auto">
              {SOURCES.map((src) => (
                <li
                  key={src}
                  className="flex items-start gap-1.5 text-xs text-emerald-700/80 dark:text-emerald-400/80"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                  {src}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-emerald-700/70 dark:text-emerald-400/60 border-t border-emerald-200 dark:border-emerald-800 pt-3 leading-relaxed">
            Todas as estatísticas apresentadas nesta página foram revisadas manualmente
            utilizando múltiplas fontes históricas independentes. Quando necessário,
            divergências entre fontes foram analisadas individualmente até a confirmação dos
            dados.
          </p>
        </div>
      )}
    </div>
  );
}
