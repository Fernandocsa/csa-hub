import { CheckCircle2 } from "lucide-react";

interface VerifiedBadgeProps {
  /** Only renders when status is "verified" */
  status?: string | null;
  /** sm = inline badge (lists/rankings), md = standalone badge (player header) */
  size?: "sm" | "md";
}

export function VerifiedBadge({ status, size = "sm" }: VerifiedBadgeProps) {
  if (status !== "verified") return null;

  const title =
    "Todas as estatísticas foram revisadas manualmente e conferidas com fontes históricas.";

  if (size === "md") {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 select-none cursor-default"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Verificado
      </span>
    );
  }

  return (
    <span
      title={title}
      className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 cursor-default select-none"
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
    </span>
  );
}
