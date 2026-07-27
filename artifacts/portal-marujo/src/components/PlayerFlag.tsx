import {
  BrazilFlag,
  isBrazilFlagEmoji,
  isBrazilianNationality,
} from "@/components/BrazilFlag";

interface PlayerFlagProps {
  flag?: string | null;
  nationality?: string | null;
  size?: "sm" | "md" | "lg";
  /** When true, Brazilian nationality renders BrazilFlag (default). When false, Brasil is hidden. */
  showBrazil?: boolean;
}

/**
 * Nationality marker next to player names.
 * Brazil → PNG image; other countries → emoji from `nationalityFlag`.
 */
export function PlayerFlag({
  flag,
  nationality,
  size = "sm",
  showBrazil = true,
}: PlayerFlagProps) {
  const brazilian =
    isBrazilianNationality(nationality) || isBrazilFlagEmoji(flag);

  if (brazilian) {
    if (!showBrazil) return null;
    return (
      <BrazilFlag
        size={size === "lg" ? "lg" : size === "md" ? "md" : "sm"}
        title={nationality?.trim() || "Brasil"}
        className={size === "md" || size === "lg" ? "mr-1.5" : "mr-0.5"}
      />
    );
  }

  if (!flag) return null;

  return (
    <span
      title={nationality ?? undefined}
      aria-label={nationality ?? undefined}
      className={
        size === "lg"
          ? "text-3xl mr-1.5 leading-none"
          : size === "md"
            ? "text-xl mr-1.5 leading-none"
            : "mr-0.5 text-base leading-none"
      }
    >
      {flag}
    </span>
  );
}
