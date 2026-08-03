import { Link } from "wouter";
import { OpponentCrest } from "@/components/OpponentCrest";
import { cn } from "@/lib/utils";
import type { ReactNode, MouseEvent } from "react";

function stopRowNav(e: MouseEvent) {
  e.stopPropagation();
}

/** Adversário → histórico (/adversarios/:id). */
export function OpponentHistoryLink({
  opponentId,
  name,
  logoUrl,
  className,
  showCrest = true,
  crestAfter = true,
  crestFallback = false,
  onClick,
}: {
  opponentId?: number | null;
  name: string;
  logoUrl?: string | null;
  className?: string;
  showCrest?: boolean;
  /** Crest after the name (match lists). */
  crestAfter?: boolean;
  /** Show initials when logo is missing (transfer rows). */
  crestFallback?: boolean;
  onClick?: (e: MouseEvent) => void;
}) {
  const crest = showCrest ? (
    <OpponentCrest url={logoUrl} name={name} size="sm" fallback={crestFallback} />
  ) : null;
  const inner = (
    <span className={cn("inline-flex items-center gap-1.5 min-w-0", className)}>
      {!crestAfter && crest}
      <span className="truncate">{name}</span>
      {crestAfter && crest}
    </span>
  );
  if (opponentId == null) return inner;
  return (
    <Link
      href={`/adversarios/${opponentId}`}
      className={cn(
        "font-medium hover:text-primary hover:underline inline-flex items-center min-w-0",
        className,
      )}
      onClick={(e) => {
        stopRowNav(e);
        onClick?.(e);
      }}
      title={`Histórico vs ${name}`}
    >
      {inner}
    </Link>
  );
}

/** Placar → ficha da partida (/partidas/:id). */
export function MatchScoreLink({
  matchId,
  children,
  className,
  title,
}: {
  matchId: number;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Link
      href={`/partidas/${matchId}`}
      className={cn(
        "font-mono font-bold hover:text-primary hover:underline tabular-nums",
        className,
      )}
      onClick={stopRowNav}
      title={title ?? "Ver partida"}
    >
      {children}
    </Link>
  );
}
