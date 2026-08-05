import { cn } from "@/lib/utils";

export type PublicBadge = {
  id: number;
  label: string;
  source?: string;
  autoKind?: string | null;
  seasonYear?: number | null;
};

function badgeTitle(b: PublicBadge): string {
  const year = b.seasonYear;
  if (b.autoKind === "top_assister" && year != null) {
    return `Líder de assistências em ${year}`;
  }
  if (b.autoKind === "top_scorer" && year != null) {
    return `Líder de gols em ${year}`;
  }
  if (b.autoKind === "top_scorer_competition") {
    return year != null ? `${b.label} — líder de gols da competição em ${year}` : b.label;
  }
  return b.label;
}

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
          title={badgeTitle(b)}
        >
          {b.label}
        </li>
      ))}
    </ul>
  );
}
