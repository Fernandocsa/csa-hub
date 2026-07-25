interface PlayerFlagProps {
  flag?: string | null;
  nationality?: string | null;
  size?: "sm" | "md";
}

/**
 * Renders a nationality flag emoji next to player names.
 * Returns null for Brazilian players (no flag shown — default nationality).
 */
export function PlayerFlag({ flag, nationality, size = "sm" }: PlayerFlagProps) {
  if (!flag || nationality === "Brasil") return null;
  return (
    <span
      title={nationality ?? undefined}
      aria-label={nationality ?? undefined}
      className={size === "md" ? "text-xl mr-1.5" : "mr-1 text-base leading-none"}
    >
      {flag}
    </span>
  );
}
