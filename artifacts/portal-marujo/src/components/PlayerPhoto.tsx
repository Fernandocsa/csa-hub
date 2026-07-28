import { EntityPhoto, entityInitials } from "@/components/EntityPhoto";

/** @deprecated Prefer EntityPhoto — kept as thin alias for player call sites. */
export const playerInitials = entityInitials;

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
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <EntityPhoto
      url={url}
      name={name}
      size={size}
      shape="circle"
      className={className}
      label="Foto do jogador"
    />
  );
}
