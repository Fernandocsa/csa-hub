import { cn } from "@/lib/utils";
import { LOCAL_FLAG_PATHS } from "@/lib/nationality-flags";

/** Local SVG (Wikimedia Commons Flag_of_Brazil.svg), no remote hotlink. */
export const BRAZIL_FLAG_URL = LOCAL_FLAG_PATHS.br;

export const BRAZIL_FLAG_EMOJI = "🇧🇷";

type FlagSize = "sm" | "md" | "lg";

/** Roughly matches former emoji footprint (text-base ≈ 16px tall). */
const SIZE_CLASS: Record<FlagSize, string> = {
  sm: "h-3.5 w-[1.25rem]",
  md: "h-5 w-7",
  lg: "h-7 w-10",
};

export function isBrazilianNationality(nationality?: string | null): boolean {
  if (!nationality) return false;
  const n = nationality.trim().toLowerCase();
  return (
    n === "brasil" ||
    n === "brasileiro" ||
    n === "brasileira" ||
    n === "brazil" ||
    n === "bra" ||
    n === "br"
  );
}

export function isBrazilFlagEmoji(flag?: string | null): boolean {
  return !!flag && flag.includes(BRAZIL_FLAG_EMOJI);
}

/**
 * Small Brazil flag image for nationality / country markers.
 */
export function BrazilFlag({
  size = "sm",
  className,
  title = "Brasil",
}: {
  size?: FlagSize;
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={BRAZIL_FLAG_URL}
      alt={title}
      title={title}
      loading="lazy"
      decoding="async"
      className={cn(
        SIZE_CLASS[size],
        "inline-block shrink-0 object-cover rounded-[1px] align-middle",
        className,
      )}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export { SIZE_CLASS as FLAG_SIZE_CLASS };
export type { FlagSize };
