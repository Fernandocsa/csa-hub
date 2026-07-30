import { Link } from "wouter";
import { ResultBadge } from "@/components/ui/result-badge";

export interface MatchRowItem {
  matchId: number;
  date: string;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  role?: string;
  shirtNumber?: number | null;
}

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

export function MatchRows({ matches }: { matches: MatchRowItem[] }) {
  if (matches.length === 0) return null;

  return (
    <ul className="border rounded divide-y">
      {matches.map((m) => {
        const isUnknown = m.result === "unknown";
        const metaParts: string[] = [];
        if (m.role) metaParts.push(roleLabel(m.role));
        if (m.shirtNumber != null) metaParts.push(`#${m.shirtNumber}`);
        metaParts.push(homeAwayLabel(m.homeAway));

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
                {metaParts.join(" · ")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
