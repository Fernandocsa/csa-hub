import { cn } from "@/lib/utils";

export type PublicBadge = {
  id: number;
  label: string;
  source?: string;
  autoKind?: string | null;
  seasonYear?: number | null;
};

/** Chips under the name. Omits the whole block when empty. */
export function EntityBadges({
  badges,
  className,
}: {
  badges?: PublicBadge[] | null;
  className?: string;
}) {
  if (!badges?.length) return null;

  return (
    <ul
      className={cn("flex flex-wrap gap-1.5 mt-2", className)}
      data-testid="entity-badges"
      aria-label="Selos"
    >
      {badges.map((b) => (
        <li
          key={b.id}
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
            b.source === "auto"
              ? "border-amber-500/35 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-border bg-muted/60 text-foreground",
          )}
          title={b.source === "auto" ? "Badge automático" : "Badge manual"}
        >
          {b.label}
        </li>
      ))}
    </ul>
  );
}
