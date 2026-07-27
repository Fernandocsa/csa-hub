import { cn } from "@/lib/utils";

/** Official CSA crest (Wikimedia / enwiki upload). Validated: 200 image/png 268×382. */
export const CSA_CREST_URL =
  "https://upload.wikimedia.org/wikipedia/en/9/93/Centro_Sportivo_Alagoano.png";

type CrestSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<CrestSize, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

/**
 * Club crest image. Renders nothing when url is missing — never a broken placeholder.
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

export function CsaCrest({
  size = "sm",
  className,
}: {
  size?: CrestSize;
  className?: string;
}) {
  return <OpponentCrest url={CSA_CREST_URL} name="CSA" size={size} className={className} />;
}
