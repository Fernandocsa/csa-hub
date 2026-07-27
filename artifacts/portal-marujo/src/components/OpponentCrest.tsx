import { cn } from "@/lib/utils";

type CrestSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<CrestSize, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

/**
 * Opponent crest from Wikimedia Commons (or any public logo_url).
 * Renders nothing when url is missing — never a broken placeholder.
 */
export function OpponentCrest({
  url,
  name,
  size = "sm",
  className,
}: {
  url?: string | null;
  name: string;
  size?: CrestSize;
  className?: string;
}) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt={`Escudo ${name}`}
      loading="lazy"
      decoding="async"
      className={cn(
        SIZE_CLASS[size],
        "inline-block shrink-0 object-contain",
        className,
      )}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
