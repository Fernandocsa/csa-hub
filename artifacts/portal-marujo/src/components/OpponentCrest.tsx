import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { entityInitials } from "@/components/EntityPhoto";

/** Official CSA crest (Wikimedia / enwiki upload). Validated: 200 image/png 268×382. */
export const CSA_CREST_URL =
  "https://upload.wikimedia.org/wikipedia/en/9/93/Centro_Sportivo_Alagoano.png";

type CrestSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<CrestSize, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const FALLBACK_TEXT: Record<CrestSize, string> = {
  sm: "text-[8px]",
  md: "text-[10px]",
  lg: "text-xs",
};

/**
 * Club crest image. With fallback=true, shows monogram when URL is missing or fails.
 * Without fallback, renders nothing when url is missing (list/match rows stay clean).
 */
export function OpponentCrest({
  url,
  name,
  size = "sm",
  className,
  fallback = false,
}: {
  url?: string | null;
  name: string;
  size?: CrestSize;
  className?: string;
  /** Show initials monogram when logo is missing/broken (detail headers). */
  fallback?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = url?.trim() || null;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = !!src && !failed;

  if (!showImg && !fallback) return null;

  if (!showImg) {
    return (
      <span
        className={cn(
          SIZE_CLASS[size],
          FALLBACK_TEXT[size],
          "inline-flex shrink-0 items-center justify-center rounded-full",
          "bg-muted font-semibold text-muted-foreground select-none",
          className,
        )}
        title={name}
        aria-label={`Escudo ${name}`}
      >
        <span aria-hidden>{entityInitials(name)}</span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`Escudo ${name}`}
      loading="lazy"
      decoding="async"
      className={cn(
        SIZE_CLASS[size],
        "inline-block shrink-0 object-contain",
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}

export function CsaCrest({
  size = "sm",
  className,
}: {
  size?: CrestSize;
  className?: string;
}) {
  return <OpponentCrest url={CSA_CREST_URL} name="CSA" size={size} className={className} />;
}
