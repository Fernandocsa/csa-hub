import { ResultBadge } from "@/components/ui/result-badge";
import { OpponentHistoryLink, MatchScoreLink } from "@/components/MatchNavLinks";

export interface MatchRowItem {
  matchId: number;
  date: string;
  opponentId?: number;
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
        const score = (
          <>
            {isUnknown ? "?" : m.goalsFor ?? "–"}
            <span className="text-muted-foreground mx-0.5">–</span>
            {isUnknown ? "?" : m.goalsAgainst ?? "–"}
          </>
        );

        return (
          <li
            key={m.matchId}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm"
          >
            <span className="text-xs text-muted-foreground tabular-nums w-[5.5rem] shrink-0">
              {fmtDate(m.date)}
            </span>
            {!isUnknown && m.result !== "unknown" ? (
              <ResultBadge result={m.result} />
            ) : (
              <span className="w-6 h-6" />
            )}
            <span className="font-medium min-w-0 flex-1 truncate inline-flex items-center gap-1.5 flex-wrap">
              <span>CSA</span>
              <MatchScoreLink matchId={m.matchId} className="font-mono tabular-nums font-normal">
                {score}
              </MatchScoreLink>
              <OpponentHistoryLink
                opponentId={m.opponentId}
                name={m.opponent}
                showCrest={false}
              />
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {metaParts.join(" · ")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
