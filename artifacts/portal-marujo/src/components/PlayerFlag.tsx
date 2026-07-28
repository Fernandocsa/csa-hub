import { cn } from "@/lib/utils";
import {
  BrazilFlag,
  FLAG_SIZE_CLASS,
  isBrazilianNationality,
  isBrazilFlagEmoji,
} from "@/components/BrazilFlag";
import { resolveNationalityFlagSrc } from "@/lib/nationality-flags";

interface PlayerFlagProps {
  flag?: string | null;
  nationality?: string | null;
  size?: "sm" | "md" | "lg";
  /** When true, Brazilian nationality renders Brazil flag (default). When false, Brasil is hidden. */
  showBrazil?: boolean;
}

/**
 * Nationality marker next to player names.
 * Local SVG by nationality (or legacy emoji → same asset). Unknown → nothing.
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

  const src = resolveNationalityFlagSrc({ nationality, flag });
  if (!src) return null;

  return (
    <img
      src={src}
      alt={nationality?.trim() || "Bandeira"}
      title={nationality ?? undefined}
      loading="lazy"
      decoding="async"
      className={cn(
        FLAG_SIZE_CLASS[size],
        "inline-block shrink-0 object-cover rounded-[1px] align-middle",
        size === "md" || size === "lg" ? "mr-1.5" : "mr-0.5",
      )}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
