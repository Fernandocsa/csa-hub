import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";

type PlayerRow = { playerId: number; playerName: string; value: number };
type ManagerRow = { managerId: number; managerName: string; value: number };
type MatchRow = {
  matchId: number;
  matchDate: string;
  season: string;
  opponentName: string;
  competitionName: string;
  goalsFor: number;
  goalsAgainst: number;
  margin: number;
};
type Streak = {
  length: number;
  startDate: string | null;
  endDate: string | null;
  startMatchId: number | null;
  endMatchId: number | null;
};
type PlayerStreak = Streak & { playerId: number; playerName: string };

type RecordsPayload = {
  rules: { matches: string; appearances: string; titles: string };
  players: {
    topScorers: PlayerRow[];
    topAssists: PlayerRow[];
    topAppearances: PlayerRow[];
    topPenaltyGoals: PlayerRow[];
    topHatTricks: PlayerRow[];
    topWins: PlayerRow[];
    topGoalsAsSubstitute: PlayerRow[];
    topAppearancesAsSubstitute: PlayerRow[];
    topTitles: PlayerRow[];
    consecutiveStarts: { historical: PlayerStreak[]; active: PlayerStreak[] };
  };
  managers: {
    topWins: ManagerRow[];
    topTitles: ManagerRow[];
  };
  team: {
    biggestWins: MatchRow[];
    unbeatenStreak: { historical: Streak; active: Streak };
    winStreak: { historical: Streak; active: Streak };
    cleanSheetStreak: { historical: Streak; active: Streak };
  };
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

function PlayerList({ rows }: { rows: PlayerRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados ainda.</p>;
  }
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={r.playerId} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 truncate">
            <span className="text-gray-400 tabular-nums mr-2">{i + 1}.</span>
            <Link
              href={`/admin/jogadores/${r.playerId}`}
              className="text-[#1B3A6B] hover:underline font-medium"
            >
              {r.playerName}
            </Link>
          </span>
          <span className="tabular-nums font-semibold shrink-0">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}

function ManagerList({ rows }: { rows: ManagerRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados ainda.</p>;
  }
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={r.managerId} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 truncate">
            <span className="text-gray-400 tabular-nums mr-2">{i + 1}.</span>
            <Link
              href={`/admin/tecnicos/${r.managerId}`}
              className="text-[#1B3A6B] hover:underline font-medium"
            >
              {r.managerName}
            </Link>
          </span>
          <span className="tabular-nums font-semibold shrink-0">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}

function StreakBlock({
  historical,
  active,
}: {
  historical: Streak;
  active: Streak;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-gray-50 rounded-md p-3">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">Histórico</p>
        <p className="text-2xl font-black text-[#1B3A6B] mt-0.5">{historical.length}</p>
        <p className="text-xs text-gray-500 mt-1">
          {fmtDate(historical.startDate)} → {fmtDate(historical.endDate)}
        </p>
      </div>
      <div className="bg-gray-50 rounded-md p-3">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">Em andamento</p>
        <p className="text-2xl font-black text-[#F5A623] mt-0.5">{active.length}</p>
        <p className="text-xs text-gray-500 mt-1">
          {active.length > 0
            ? `${fmtDate(active.startDate)} → ${fmtDate(active.endDate)}`
            : "Nenhuma"}
        </p>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminRecords() {
  const [data, setData] = useState<RecordsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await adminFetch("/admin/records");
    if (!r.ok) {
      setError("Falha ao carregar recordes");
      setLoading(false);
      return;
    }
    setData(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1B3A6B]">Recordes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Recordes históricos e sequências em andamento (só partidas oficiais, sem amistosos/W.O.).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !data ? null : (
        <>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-900 space-y-0.5">
            <p>{data.rules.matches}</p>
            <p>{data.rules.appearances}</p>
            <p>{data.rules.titles}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Artilheiro geral">
              <PlayerList rows={data.players.topScorers} />
            </Card>
            <Card title="Mais assistências">
              <PlayerList rows={data.players.topAssists} />
            </Card>
            <Card title="Mais jogos">
              <PlayerList rows={data.players.topAppearances} />
            </Card>
            <Card title="Gols de pênalti">
              <PlayerList rows={data.players.topPenaltyGoals} />
            </Card>
            <Card title="Hat-tricks (3+ gols no mesmo jogo)">
              <PlayerList rows={data.players.topHatTricks} />
            </Card>
            <Card title="Mais vitórias (jogador)">
              <PlayerList rows={data.players.topWins} />
            </Card>
            <Card title="Gols entrando como reserva">
              <PlayerList rows={data.players.topGoalsAsSubstitute} />
            </Card>
            <Card title="Mais jogos como reserva">
              <PlayerList rows={data.players.topAppearancesAsSubstitute} />
            </Card>
            <Card title="Mais títulos (jogador)">
              <PlayerList rows={data.players.topTitles} />
            </Card>
            <Card title="Mais vitórias (técnico)">
              <ManagerList rows={data.managers.topWins} />
            </Card>
            <Card title="Mais títulos (técnico)">
              <ManagerList rows={data.managers.topTitles} />
            </Card>
          </div>

          <Card title="Maior goleada">
            {data.team.biggestWins.length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados ainda.</p>
            ) : (
              <ol className="space-y-1.5">
                {data.team.biggestWins.map((m, i) => (
                  <li key={m.matchId} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="text-gray-400 tabular-nums mr-2">{i + 1}.</span>
                      <Link
                        href={`/admin/partidas/${m.matchId}`}
                        className="text-[#1B3A6B] hover:underline font-medium"
                      >
                        {fmtDate(m.matchDate)} × {m.opponentName}
                      </Link>
                      <span className="text-gray-400 text-xs ml-2">{m.competitionName}</span>
                    </span>
                    <span className="tabular-nums font-semibold shrink-0">
                      {m.goalsFor}×{m.goalsAgainst} (+{m.margin})
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Invencibilidade">
              <StreakBlock
                historical={data.team.unbeatenStreak.historical}
                active={data.team.unbeatenStreak.active}
              />
            </Card>
            <Card title="Sequência de vitórias">
              <StreakBlock
                historical={data.team.winStreak.historical}
                active={data.team.winStreak.active}
              />
            </Card>
            <Card title="Sem sofrer gol">
              <StreakBlock
                historical={data.team.cleanSheetStreak.historical}
                active={data.team.cleanSheetStreak.active}
              />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Jogos seguidos como titular (histórico)">
              {data.players.consecutiveStarts.historical.length === 0 ? (
                <p className="text-sm text-gray-400">Sem dados ainda.</p>
              ) : (
                <ol className="space-y-1.5">
                  {data.players.consecutiveStarts.historical.map((r, i) => (
                    <li
                      key={`${r.playerId}-${r.startMatchId}`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-gray-400 tabular-nums mr-2">{i + 1}.</span>
                        <Link
                          href={`/admin/jogadores/${r.playerId}`}
                          className="text-[#1B3A6B] hover:underline font-medium"
                        >
                          {r.playerName}
                        </Link>
                        <span className="text-xs text-gray-400 ml-2">
                          {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                        </span>
                      </span>
                      <span className="tabular-nums font-semibold shrink-0">{r.length}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
            <Card title="Jogos seguidos como titular (em andamento)">
              {data.players.consecutiveStarts.active.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma sequência ativa.</p>
              ) : (
                <ol className="space-y-1.5">
                  {data.players.consecutiveStarts.active.map((r, i) => (
                    <li
                      key={`${r.playerId}-active`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-gray-400 tabular-nums mr-2">{i + 1}.</span>
                        <Link
                          href={`/admin/jogadores/${r.playerId}`}
                          className="text-[#1B3A6B] hover:underline font-medium"
                        >
                          {r.playerName}
                        </Link>
                        <span className="text-xs text-gray-400 ml-2">
                          desde {fmtDate(r.startDate)}
                        </span>
                      </span>
                      <span className="tabular-nums font-semibold shrink-0 text-[#F5A623]">
                        {r.length}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
