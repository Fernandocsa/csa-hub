import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PlayerRow = {
  playerId: number;
  playerName: string;
  value: number;
  appearances?: number;
};
type MultiGoalBucket = { goalsInMatch: number; players: PlayerRow[] };
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
type ManagerStreak = Streak & { managerId: number; managerName: string };

type RecordsPayload = {
  rules: {
    matches: string;
    appearances: string;
    titles: string;
    cleanSheets?: string;
  };
  players: {
    topScorers: PlayerRow[];
    topAssists: PlayerRow[];
    topAppearances: PlayerRow[];
    topPenaltyGoals: PlayerRow[];
    topFreeKickGoals: PlayerRow[];
    topHatTricks: PlayerRow[];
    multiGoalHauls: MultiGoalBucket[];
    topYellowCards: PlayerRow[];
    topRedCards: PlayerRow[];
    topWins: PlayerRow[];
    topGoalsAsSubstitute: PlayerRow[];
    topAppearancesAsSubstitute: PlayerRow[];
    topCleanSheets: PlayerRow[];
    topTitles: PlayerRow[];
    consecutiveStarts: { historical: PlayerStreak[]; active: PlayerStreak[] };
    cleanSheetStreak: { historical: PlayerStreak[]; active: PlayerStreak[] };
  };
  managers: {
    topWins: ManagerRow[];
    topTitles: ManagerRow[];
    winStreak: { historical: ManagerStreak[]; active: ManagerStreak[] };
    unbeatenStreak: { historical: ManagerStreak[]; active: ManagerStreak[] };
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

function multiGoalTitle(goalsInMatch: number) {
  if (goalsInMatch === 3) return "Hat-tricks (exatos 3 gols)";
  if (goalsInMatch === 4) return "Poker (exatos 4 gols)";
  if (goalsInMatch === 5) return "Repóquer (exatos 5 gols)";
  return `${goalsInMatch} gols no mesmo jogo`;
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

function ManagerStreakList({
  rows,
  activeTone = false,
}: {
  rows: ManagerStreak[];
  activeTone?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        {activeTone ? "Nenhuma sequência ativa." : "Sem dados ainda."}
      </p>
    );
  }
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li
          key={`${r.managerId}-${r.startMatchId ?? "active"}`}
          className="flex items-baseline justify-between gap-3 text-sm"
        >
          <span className="min-w-0 truncate">
            <span className="text-gray-400 tabular-nums mr-2">{i + 1}.</span>
            <Link
              href={`/admin/tecnicos/${r.managerId}`}
              className="text-[#1B3A6B] hover:underline font-medium"
            >
              {r.managerName}
            </Link>
            <span className="text-xs text-gray-400 ml-2">
              {activeTone
                ? `desde ${fmtDate(r.startDate)}`
                : `${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}`}
            </span>
          </span>
          <span
            className={`tabular-nums font-semibold shrink-0 ${
              activeTone ? "text-[#F5A623]" : ""
            }`}
          >
            {r.length}
          </span>
        </li>
      ))}
    </ol>
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

  const multiGoalHauls = (() => {
    const buckets = data?.players.multiGoalHauls ?? [];
    if (buckets.length > 0) return buckets;
    if (data?.players.topHatTricks) {
      return [{ goalsInMatch: 3, players: data.players.topHatTricks }];
    }
    return [{ goalsInMatch: 3, players: [] as PlayerRow[] }];
  })();

  // Always show exact-3; only show 4+ when there is at least one haul
  const displayHauls = (() => {
    const three =
      multiGoalHauls.find((b) => b.goalsInMatch === 3) ?? {
        goalsInMatch: 3,
        players: [] as PlayerRow[],
      };
    const rest = multiGoalHauls.filter((b) => b.goalsInMatch > 3);
    return [three, ...rest];
  })();

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
            {data.rules.cleanSheets ? <p>{data.rules.cleanSheets}</p> : null}
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
            <Card title="Gols de falta">
              <PlayerList rows={data.players.topFreeKickGoals} />
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

          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Gols no mesmo jogo
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {displayHauls.map((bucket) => (
                <Card
                  key={bucket.goalsInMatch}
                  title={multiGoalTitle(bucket.goalsInMatch)}
                >
                  <PlayerList rows={bucket.players} />
                </Card>
              ))}
            </div>
          </div>

          <Card title="Cartões">
            <Tabs defaultValue="yellow">
              <TabsList className="mb-3">
                <TabsTrigger value="yellow">Mais cartões amarelos</TabsTrigger>
                <TabsTrigger value="red">Mais cartões vermelhos</TabsTrigger>
              </TabsList>
              <TabsContent value="yellow">
                <PlayerList rows={data.players.topYellowCards ?? []} />
              </TabsContent>
              <TabsContent value="red">
                <PlayerList rows={data.players.topRedCards ?? []} />
              </TabsContent>
            </Tabs>
          </Card>

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
            <Card title="Mais vitórias seguidas (técnico) — histórico">
              <ManagerStreakList
                rows={data.managers.winStreak?.historical ?? []}
              />
            </Card>
            <Card title="Mais vitórias seguidas (técnico) — em andamento">
              <ManagerStreakList
                rows={data.managers.winStreak?.active ?? []}
                activeTone
              />
            </Card>
            <Card title="Mais jogos sem perder (técnico) — histórico">
              <ManagerStreakList
                rows={data.managers.unbeatenStreak?.historical ?? []}
              />
            </Card>
            <Card title="Mais jogos sem perder (técnico) — em andamento">
              <ManagerStreakList
                rows={data.managers.unbeatenStreak?.active ?? []}
                activeTone
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

          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Clean sheets (goleiros)
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card title="Mais clean sheets (geral)">
                {(data.players.topCleanSheets ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">Sem dados ainda.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {data.players.topCleanSheets.map((r, i) => (
                      <li
                        key={r.playerId}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          <span className="text-gray-400 tabular-nums mr-2">
                            {i + 1}.
                          </span>
                          <Link
                            href={`/admin/jogadores/${r.playerId}`}
                            className="text-[#1B3A6B] hover:underline font-medium"
                          >
                            {r.playerName}
                          </Link>
                        </span>
                        <span className="tabular-nums font-semibold shrink-0 text-right">
                          {r.value}
                          {r.appearances != null ? (
                            <span className="text-xs font-normal text-gray-400 ml-1">
                              em {r.appearances} jogos
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
              <Card title="Mais clean sheets em sequência (histórico)">
                {(data.players.cleanSheetStreak?.historical ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">Sem dados ainda.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {data.players.cleanSheetStreak.historical.map((r, i) => (
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
              <Card title="Mais clean sheets em sequência (em andamento)">
                {(data.players.cleanSheetStreak?.active ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma sequência ativa.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {data.players.cleanSheetStreak.active.map((r, i) => (
                      <li
                        key={`${r.playerId}-cs-active`}
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
          </div>
        </>
      )}
    </div>
  );
}
