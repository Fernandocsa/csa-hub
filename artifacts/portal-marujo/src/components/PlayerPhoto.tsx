import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type PhotoSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<PhotoSize, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-14 w-14 text-sm",
  lg: "h-24 w-24 text-xl",
};

/** Initials from display name (up to 2 significant tokens). */
export function playerInitials(name?: string | null): string {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Player profile photo with initials fallback when URL is missing or fails to load.
 */
export function PlayerPhoto({
  url,
  name,
  size = "md",
  className,
}: {
  url?: string | null;
  name?: string | null;
  size?: PhotoSize;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = url?.trim() || null;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = !!src && !failed;

  return (
    <div
      className={cn(
        SIZE_CLASS[size],
        "relative shrink-0 overflow-hidden rounded-full bg-muted text-muted-foreground",
        "inline-flex items-center justify-center font-semibold select-none",
        className,
      )}
      title={name ?? undefined}
      aria-label={name ? `Foto de ${name}` : "Foto do jogador"}
    >
      {showImg ? (
        <img
          src={src}
          alt={name ?? "Jogador"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{playerInitials(name)}</span>
      )}
    </div>
  );
}
