import { Link } from "wouter";
import type { PlayerSheetMatch } from "@workspace/api-client-react";
import { ResultBadge } from "@/components/ui/result-badge";

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

function roleLabel(role: string) {
  if (role === "starter") return "Titular";
  if (role === "bench") return "Reserva";
  return role;
}

function homeAwayLabel(v: string) {
  if (v === "home") return "Casa";
  if (v === "away") return "Fora";
  if (v === "neutral") return "Neutro";
  return v;
}

export function PlayerMatchRows({ matches }: { matches: PlayerSheetMatch[] }) {
  if (matches.length === 0) return null;

  return (
    <ul className="border rounded divide-y">
      {matches.map((m) => {
        const isUnknown = m.result === "unknown";
        return (
          <li key={m.matchId}>
            <Link
              href={`/partidas/${m.matchId}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm hover:bg-muted/50"
            >
              <span className="text-xs text-muted-foreground tabular-nums w-[5.5rem] shrink-0">
                {fmtDate(m.date)}
              </span>
              {!isUnknown && m.result !== "unknown" ? (
                <ResultBadge result={m.result} />
              ) : (
                <span className="w-6 h-6" />
              )}
              <span className="font-medium min-w-0 flex-1 truncate">
                CSA{" "}
                <span className="font-mono tabular-nums font-normal">
                  {isUnknown ? "?" : m.goalsFor ?? "–"}
                  <span className="text-muted-foreground mx-0.5">–</span>
                  {isUnknown ? "?" : m.goalsAgainst ?? "–"}
                </span>{" "}
                {m.opponent}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {roleLabel(m.role)}
                {m.shirtNumber != null ? ` · #${m.shirtNumber}` : ""}
                {" · "}
                {homeAwayLabel(m.homeAway)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
