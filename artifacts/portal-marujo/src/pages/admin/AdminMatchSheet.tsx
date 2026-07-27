import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { groupPlayersByPosition } from "@/lib/position-groups";

type RosterPlayer = {
  id: number;
  name: string;
  position: string | null;
  appearances: number;
  goals: number;
  assists: number;
  inSeason: boolean;
};

type LineupRole = "starter" | "bench" | "out";

type LineupDraft = {
  playerId: number;
  playerName: string;
  role: "starter" | "bench";
  shirtNumber: string;
  position: string;
  sortOrder: number;
};

type GoalDraft = {
  key: string;
  scorerPlayerId: string;
  minute: string;
  injuryTimeMinute: string;
  assistPlayerId: string;
};

type CardDraft = {
  key: string;
  cardType: "yellow" | "red";
  playerId: string;
  minute: string;
  injuryTimeMinute: string;
};

type SubDraft = {
  key: string;
  playerOutId: string;
  playerInId: string;
  minute: string;
  injuryTimeMinute: string;
};

type MatchMeta = {
  id: number;
  matchDate: string;
  season: string;
  opponentName: string;
  goalsFor: number;
  goalsAgainst: number;
  competitionName: string;
  homeAway: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminMatchSheet() {
  const params = useParams<{ id: string }>();
  const matchId = Number(params.id);

  const [match, setMatch] = useState<MatchMeta | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [search, setSearch] = useState("");
  const [lineups, setLineups] = useState<LineupDraft[]>([]);
  const [goals, setGoals] = useState<GoalDraft[]>([]);
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [subs, setSubs] = useState<SubDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState<"lineup" | "goals" | "cards" | "subs">("lineup");

  const load = useCallback(async () => {
    if (!matchId || Number.isNaN(matchId)) return;
    setLoading(true);
    setError("");
    try {
      const [matchesRes, sheetRes, rosterRes] = await Promise.all([
        adminFetch("/admin/matches?limit=500&offset=0"),
        adminFetch(`/admin/matches/${matchId}/sheet`),
        adminFetch(`/admin/matches/${matchId}/roster`),
      ]);

      if (!matchesRes.ok || !sheetRes.ok || !rosterRes.ok) {
        throw new Error("Erro ao carregar ficha da partida");
      }

      const matchesJson = await matchesRes.json();
      const found = (matchesJson.data as MatchMeta[] | undefined)?.find((m) => m.id === matchId);
      if (!found) throw new Error("Partida não encontrada");
      setMatch(found);

      const sheet = await sheetRes.json();
      setLineups(
        (sheet.lineups ?? [])
          .filter((l: { side?: string }) => !l.side || l.side === "csa")
          .map((l: any, i: number) => ({
            playerId: l.playerId,
            playerName: l.playerName,
            role: l.role === "bench" ? "bench" : "starter",
            shirtNumber: l.shirtNumber != null ? String(l.shirtNumber) : "",
            position: l.position ?? "",
            sortOrder: l.sortOrder ?? i,
          })),
      );
      setGoals(
        (sheet.goals ?? []).map((g: any) => ({
          key: uid(),
          scorerPlayerId: String(g.scorerPlayerId ?? ""),
          minute: String(g.minute ?? ""),
          injuryTimeMinute: g.injuryTimeMinute != null ? String(g.injuryTimeMinute) : "",
          assistPlayerId: g.assistPlayerId != null ? String(g.assistPlayerId) : "",
        })),
      );
      setCards(
        (sheet.cards ?? []).map((c: any) => ({
          key: uid(),
          cardType: c.cardType === "red" ? "red" : "yellow",
          playerId: String(c.playerId ?? ""),
          minute: String(c.minute ?? ""),
          injuryTimeMinute: c.injuryTimeMinute != null ? String(c.injuryTimeMinute) : "",
        })),
      );
      setSubs(
        (sheet.substitutions ?? [])
          .filter((s: { side?: string }) => !s.side || s.side === "csa")
          .map((s: any) => ({
            key: uid(),
            playerOutId: String(s.playerOutId ?? ""),
            playerInId: String(s.playerInId ?? ""),
            minute: String(s.minute ?? ""),
            injuryTimeMinute:
              s.injuryTimeMinute != null ? String(s.injuryTimeMinute) : "",
          })),
      );

      const rosterJson = await rosterRes.json();
      setRoster(rosterJson.players ?? []);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar");
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  async function searchRoster(q: string) {
    setSearch(q);
    if (!matchId) return;
    const r = await adminFetch(
      `/admin/matches/${matchId}/roster${q.trim().length >= 2 ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
    );
    if (r.ok) {
      const data = await r.json();
      setRoster(data.players ?? []);
    }
  }

  const lineupByPlayer = useMemo(() => {
    const m = new Map<number, LineupDraft>();
    for (const l of lineups) m.set(l.playerId, l);
    return m;
  }, [lineups]);

  const starters = lineups.filter((l) => l.role === "starter");
  const bench = lineups.filter((l) => l.role === "bench");
  const rosterByGroup = useMemo(() => groupPlayersByPosition(roster), [roster]);

  const softSubWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (const s of subs) {
      const outId = Number(s.playerOutId);
      const inId = Number(s.playerInId);
      const out = lineupByPlayer.get(outId);
      const inn = lineupByPlayer.get(inId);
      const outName = out?.playerName ?? `#${s.playerOutId || "?"}`;
      const inName = inn?.playerName ?? `#${s.playerInId || "?"}`;
      if (s.playerOutId && (!out || out.role !== "starter")) {
        warnings.push(
          `Quem saiu (${outName}) não está marcado como titular.`,
        );
      }
      if (s.playerInId && (!inn || inn.role !== "bench")) {
        warnings.push(
          `Quem entrou (${inName}) não está marcado como reserva.`,
        );
      }
    }
    return warnings;
  }, [subs, lineupByPlayer]);

  function setPlayerRole(player: RosterPlayer, role: LineupRole) {
    setSavedMsg("");
    setLineups((prev) => {
      const without = prev.filter((l) => l.playerId !== player.id);
      if (role === "out") return without;
      const existing = prev.find((l) => l.playerId === player.id);
      return [
        ...without,
        {
          playerId: player.id,
          playerName: player.name,
          role,
          shirtNumber: existing?.shirtNumber ?? "",
          position: existing?.position || player.position || "",
          sortOrder: existing?.sortOrder ?? without.length,
        },
      ];
    });
  }

  function updateLineup(playerId: number, patch: Partial<LineupDraft>) {
    setSavedMsg("");
    setLineups((prev) =>
      prev.map((l) => (l.playerId === playerId ? { ...l, ...patch } : l)),
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const body = {
        lineups: lineups.map((l, i) => ({
          playerId: l.playerId,
          playerName: l.playerName,
          role: l.role,
          shirtNumber: l.shirtNumber === "" ? null : Number(l.shirtNumber),
          position: l.position || null,
          sortOrder: i,
          side: "csa" as const,
        })),
        goals: goals.map((g) => ({
          scorerPlayerId: Number(g.scorerPlayerId),
          minute: Number(g.minute),
          injuryTimeMinute: g.injuryTimeMinute === "" ? null : Number(g.injuryTimeMinute),
          assistPlayerId: g.assistPlayerId === "" ? null : Number(g.assistPlayerId),
          side: "csa" as const,
        })),
        cards: cards.map((c) => ({
          cardType: c.cardType,
          playerId: Number(c.playerId),
          minute: Number(c.minute),
          injuryTimeMinute: c.injuryTimeMinute === "" ? null : Number(c.injuryTimeMinute),
          side: "csa" as const,
        })),
        substitutions: subs.map((s) => ({
          playerOutId: Number(s.playerOutId),
          playerInId: Number(s.playerInId),
          minute: Number(s.minute),
          injuryTimeMinute:
            s.injuryTimeMinute === "" ? null : Number(s.injuryTimeMinute),
          side: "csa" as const,
        })),
      };

      const r = await adminFetch(`/admin/matches/${matchId}/sheet`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Erro ao salvar");
      }
      setSavedMsg("Ficha CSA salva.");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando ficha...</p>;
  }

  if (!match) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "Partida não encontrada"}</p>
        <Link href="/admin/partidas" className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block">
          Voltar às partidas
        </Link>
      </div>
    );
  }

  const selectCls = "w-full border rounded px-2 py-1.5 text-sm bg-white";
  const sheetGoalCount = goals.length;
  const goalsMismatch =
    match.goalsFor != null && sheetGoalCount !== Number(match.goalsFor);

  const tabs: { id: typeof tab; label: string; count?: number }[] = [
    { id: "lineup", label: "Escalação", count: lineups.length },
    { id: "goals", label: "Gols", count: goals.length },
    { id: "cards", label: "Cartões", count: cards.length },
    { id: "subs", label: "Substituições", count: subs.length },
  ];

  const showSoftBanner =
    starters.length !== 11 || goalsMismatch || softSubWarnings.length > 0;

  return (
    <div className="space-y-4 pb-20">
      <div>
        <Link
          href="/admin/partidas"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] mb-2"
        >
          <ChevronLeft size={13} /> Partidas
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ficha CSA</h1>
        <p className="text-sm text-gray-500 mt-1">
          {match.matchDate} · CSA {match.goalsFor}–{match.goalsAgainst} {match.opponentName} ·{" "}
          {match.competitionName} · temp. {match.season}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Só o lado do CSA nesta fase. O campo “Artilheiros” texto da partida continua separado.
        </p>
      </div>

      {showSoftBanner && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-1">
          {starters.length !== 11 && (
            <p>
              Aviso: {starters.length} titulares (o usual é 11). Pode salvar mesmo assim.
            </p>
          )}
          {goalsMismatch && (
            <p>
              Aviso: {sheetGoalCount} gol(s) na ficha ≠ placar da partida ({match.goalsFor}{" "}
              gol(s) do CSA). Pode salvar mesmo assim — o placar oficial continua sendo o da
              partida.
            </p>
          )}
          {softSubWarnings.map((w, i) => (
            <p key={`sub-warn-${i}`}>Aviso: {w} Pode salvar mesmo assim.</p>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[#1B3A6B] text-[#1B3A6B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {tab === "lineup" && (
      <section className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Escalação CSA
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {starters.length} titulares · {bench.length} reservas
            </p>
          </div>
          <Input
            placeholder="Buscar jogador por nome (fallback)..."
            value={search}
            onChange={(e) => searchRoster(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Titulares</h3>
            <div className="border rounded divide-y max-h-72 overflow-auto">
              {starters.length === 0 && (
                <p className="text-xs text-gray-400 p-3">Nenhum titular selecionado</p>
              )}
              {starters.map((l) => (
                <div key={l.playerId} className="p-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium min-w-[8rem] flex-1">{l.playerName}</span>
                  <Input
                    className="w-14 h-8"
                    placeholder="#"
                    value={l.shirtNumber}
                    onChange={(e) => updateLineup(l.playerId, { shirtNumber: e.target.value })}
                  />
                  <Input
                    className="w-20 h-8"
                    placeholder="Pos"
                    value={l.position}
                    onChange={(e) => updateLineup(l.playerId, { position: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPlayerRole(
                        { id: l.playerId, name: l.playerName, position: l.position, appearances: 0, goals: 0, assists: 0, inSeason: true },
                        "bench",
                      )
                    }
                  >
                    → Reserva
                  </Button>
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-600"
                    onClick={() =>
                      setPlayerRole(
                        { id: l.playerId, name: l.playerName, position: l.position, appearances: 0, goals: 0, assists: 0, inSeason: true },
                        "out",
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Reservas</h3>
            <div className="border rounded divide-y max-h-72 overflow-auto">
              {bench.length === 0 && (
                <p className="text-xs text-gray-400 p-3">Nenhuma reserva selecionada</p>
              )}
              {bench.map((l) => (
                <div key={l.playerId} className="p-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium min-w-[8rem] flex-1">{l.playerName}</span>
                  <Input
                    className="w-14 h-8"
                    placeholder="#"
                    value={l.shirtNumber}
                    onChange={(e) => updateLineup(l.playerId, { shirtNumber: e.target.value })}
                  />
                  <Input
                    className="w-20 h-8"
                    placeholder="Pos"
                    value={l.position}
                    onChange={(e) => updateLineup(l.playerId, { position: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPlayerRole(
                        { id: l.playerId, name: l.playerName, position: l.position, appearances: 0, goals: 0, assists: 0, inSeason: true },
                        "starter",
                      )
                    }
                  >
                    → Titular
                  </Button>
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-600"
                    onClick={() =>
                      setPlayerRole(
                        { id: l.playerId, name: l.playerName, position: l.position, appearances: 0, goals: 0, assists: 0, inSeason: true },
                        "out",
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Elenco da temporada {match.season}
          </h3>
          <div className="border rounded max-h-72 overflow-auto">
            {rosterByGroup.map(({ group, players }) => (
              <div key={group}>
                <div className="sticky top-0 z-[1] bg-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-t first:border-t-0">
                  {group}
                </div>
                <div className="divide-y">
                  {players.map((p) => {
                    const current = lineupByPlayer.get(p.id);
                    const role: LineupRole = current ? current.role : "out";
                    return (
                      <div
                        key={p.id}
                        className="px-3 py-2 flex flex-wrap items-center gap-2 text-sm hover:bg-gray-50"
                      >
                        <div className="min-w-[10rem] flex-1">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {p.position || "—"}
                            {p.inSeason ? ` · ${p.appearances} j` : " · busca"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {(["starter", "bench", "out"] as LineupRole[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setPlayerRole(p, r)}
                              className={`px-2 py-1 rounded text-xs border ${
                                role === r
                                  ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {r === "starter" ? "Titular" : r === "bench" ? "Reserva" : "Fora"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {roster.length === 0 && (
              <p className="text-xs text-gray-400 p-3">
                Nenhum jogador na temporada. Use a busca por nome.
              </p>
            )}
          </div>
        </div>
      </section>
      )}

      {tab === "goals" && (
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Gols CSA</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {sheetGoalCount} na ficha · placar CSA: {match.goalsFor}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={lineups.length === 0}
            onClick={() =>
              setGoals((g) => [
                ...g,
                {
                  key: uid(),
                  scorerPlayerId: lineups[0] ? String(lineups[0].playerId) : "",
                  minute: "",
                  injuryTimeMinute: "",
                  assistPlayerId: "",
                },
              ])
            }
          >
            <Plus size={14} className="mr-1" /> Gol
          </Button>
        </div>
        {lineups.length === 0 && (
          <p className="text-xs text-gray-400">
            Escale jogadores na aba Escalação antes de cadastrar gols.
          </p>
        )}
        <div className="space-y-2">
          {goals.map((g) => (
            <div key={g.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border rounded p-2">
              <div>
                <label className="text-[10px] uppercase text-gray-400">Autor</label>
                <select
                  className={selectCls}
                  value={g.scorerPlayerId}
                  onChange={(e) => {
                    setSavedMsg("");
                    setGoals((all) =>
                      all.map((x) =>
                        x.key === g.key ? { ...x, scorerPlayerId: e.target.value } : x,
                      ),
                    );
                  }}
                >
                  <option value="">—</option>
                  {lineups.map((l) => (
                    <option key={l.playerId} value={l.playerId}>
                      {l.playerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Minuto</label>
                <Input
                  value={g.minute}
                  onChange={(e) => {
                    setSavedMsg("");
                    setGoals((all) =>
                      all.map((x) => (x.key === g.key ? { ...x, minute: e.target.value } : x)),
                    );
                  }}
                  placeholder="23"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Acréscimo</label>
                <Input
                  value={g.injuryTimeMinute}
                  onChange={(e) => {
                    setSavedMsg("");
                    setGoals((all) =>
                      all.map((x) =>
                        x.key === g.key ? { ...x, injuryTimeMinute: e.target.value } : x,
                      ),
                    );
                  }}
                  placeholder="ex: 2 → 45+2"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Assistência</label>
                <select
                  className={selectCls}
                  value={g.assistPlayerId}
                  onChange={(e) => {
                    setSavedMsg("");
                    setGoals((all) =>
                      all.map((x) =>
                        x.key === g.key ? { ...x, assistPlayerId: e.target.value } : x,
                      ),
                    );
                  }}
                >
                  <option value="">Sem assistência</option>
                  {lineups
                    .filter((l) => String(l.playerId) !== g.scorerPlayerId)
                    .map((l) => (
                      <option key={l.playerId} value={l.playerId}>
                        {l.playerName}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                className="justify-self-end p-2 text-gray-400 hover:text-red-600"
                onClick={() => setGoals((all) => all.filter((x) => x.key !== g.key))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      {tab === "cards" && (
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Cartões CSA
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={lineups.length === 0}
            onClick={() =>
              setCards((c) => [
                ...c,
                {
                  key: uid(),
                  cardType: "yellow",
                  playerId: lineups[0] ? String(lineups[0].playerId) : "",
                  minute: "",
                  injuryTimeMinute: "",
                },
              ])
            }
          >
            <Plus size={14} className="mr-1" /> Cartão
          </Button>
        </div>
        {lineups.length === 0 && (
          <p className="text-xs text-gray-400">
            Escale jogadores na aba Escalação antes de cadastrar cartões.
          </p>
        )}
        <div className="space-y-2">
          {cards.map((c) => (
            <div key={c.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border rounded p-2">
              <div>
                <label className="text-[10px] uppercase text-gray-400">Tipo</label>
                <select
                  className={selectCls}
                  value={c.cardType}
                  onChange={(e) => {
                    setSavedMsg("");
                    setCards((all) =>
                      all.map((x) =>
                        x.key === c.key
                          ? { ...x, cardType: e.target.value as "yellow" | "red" }
                          : x,
                      ),
                    );
                  }}
                >
                  <option value="yellow">Amarelo</option>
                  <option value="red">Vermelho</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Jogador</label>
                <select
                  className={selectCls}
                  value={c.playerId}
                  onChange={(e) => {
                    setSavedMsg("");
                    setCards((all) =>
                      all.map((x) => (x.key === c.key ? { ...x, playerId: e.target.value } : x)),
                    );
                  }}
                >
                  <option value="">—</option>
                  {lineups.map((l) => (
                    <option key={l.playerId} value={l.playerId}>
                      {l.playerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Minuto</label>
                <Input
                  value={c.minute}
                  onChange={(e) => {
                    setSavedMsg("");
                    setCards((all) =>
                      all.map((x) => (x.key === c.key ? { ...x, minute: e.target.value } : x)),
                    );
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Acréscimo</label>
                <Input
                  value={c.injuryTimeMinute}
                  onChange={(e) => {
                    setSavedMsg("");
                    setCards((all) =>
                      all.map((x) =>
                        x.key === c.key ? { ...x, injuryTimeMinute: e.target.value } : x,
                      ),
                    );
                  }}
                />
              </div>
              <button
                type="button"
                className="justify-self-end p-2 text-gray-400 hover:text-red-600"
                onClick={() => setCards((all) => all.filter((x) => x.key !== c.key))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      {tab === "subs" && (
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Substituições CSA
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {subs.length} substituição(ões) · o usual é titular sair e reserva entrar
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={lineups.length < 2}
            onClick={() =>
              setSubs((s) => [
                ...s,
                {
                  key: uid(),
                  playerOutId: starters[0]
                    ? String(starters[0].playerId)
                    : lineups[0]
                      ? String(lineups[0].playerId)
                      : "",
                  playerInId: bench[0]
                    ? String(bench[0].playerId)
                    : lineups[1]
                      ? String(lineups[1].playerId)
                      : "",
                  minute: "",
                  injuryTimeMinute: "",
                },
              ])
            }
          >
            <Plus size={14} className="mr-1" /> Substituição
          </Button>
        </div>
        {lineups.length === 0 && (
          <p className="text-xs text-gray-400">
            Escale jogadores na aba Escalação antes de cadastrar substituições.
          </p>
        )}
        <div className="space-y-2">
          {subs.map((s) => (
            <div
              key={s.key}
              className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border rounded p-2"
            >
              <div>
                <label className="text-[10px] uppercase text-gray-400">Saiu ↓</label>
                <select
                  className={selectCls}
                  value={s.playerOutId}
                  onChange={(e) => {
                    setSavedMsg("");
                    setSubs((all) =>
                      all.map((x) =>
                        x.key === s.key ? { ...x, playerOutId: e.target.value } : x,
                      ),
                    );
                  }}
                >
                  <option value="">—</option>
                  {lineups.map((l) => (
                    <option key={l.playerId} value={l.playerId}>
                      {l.playerName}
                      {l.role === "starter" ? " (T)" : " (R)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Entrou ↑</label>
                <select
                  className={selectCls}
                  value={s.playerInId}
                  onChange={(e) => {
                    setSavedMsg("");
                    setSubs((all) =>
                      all.map((x) =>
                        x.key === s.key ? { ...x, playerInId: e.target.value } : x,
                      ),
                    );
                  }}
                >
                  <option value="">—</option>
                  {lineups
                    .filter((l) => String(l.playerId) !== s.playerOutId)
                    .map((l) => (
                      <option key={l.playerId} value={l.playerId}>
                        {l.playerName}
                        {l.role === "starter" ? " (T)" : " (R)"}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Minuto</label>
                <Input
                  value={s.minute}
                  onChange={(e) => {
                    setSavedMsg("");
                    setSubs((all) =>
                      all.map((x) =>
                        x.key === s.key ? { ...x, minute: e.target.value } : x,
                      ),
                    );
                  }}
                  placeholder="67"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400">Acréscimo</label>
                <Input
                  value={s.injuryTimeMinute}
                  onChange={(e) => {
                    setSavedMsg("");
                    setSubs((all) =>
                      all.map((x) =>
                        x.key === s.key
                          ? { ...x, injuryTimeMinute: e.target.value }
                          : x,
                      ),
                    );
                  }}
                  placeholder="ex: 3 → 90+3"
                />
              </div>
              <button
                type="button"
                className="justify-self-end p-2 text-gray-400 hover:text-red-600"
                onClick={() => setSubs((all) => all.filter((x) => x.key !== s.key))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedMsg && <p className="text-sm text-green-700">{savedMsg}</p>}

      <div className="flex gap-2 fixed bottom-0 left-52 right-0 max-w-5xl mx-auto px-6 py-3 bg-gray-50/95 border-t z-10">
        <Button className="bg-[#1B3A6B]" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar ficha CSA"}
        </Button>
        <Link href="/admin/partidas">
          <Button type="button" variant="outline">
            Voltar
          </Button>
        </Link>
        <span className="text-xs text-gray-400 self-center ml-2">
          Salva Escalação + Gols + Cartões + Substituições juntos
        </span>
      </div>
    </div>
  );
}
