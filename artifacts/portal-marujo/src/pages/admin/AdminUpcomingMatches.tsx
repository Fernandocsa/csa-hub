import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type UpcomingRow = {
  id: number;
  matchDate: string;
  season: string;
  homeAway: string;
  opponentId: number;
  opponentName: string;
  competitionId: number;
  competitionName: string;
  stadiumId: number | null;
  stadiumName: string | null;
  status: string;
};

type Lookup = {
  opponents: { id: number; name: string }[];
  competitions: { id: number; name: string }[];
  stadiums: { id: number; name: string }[];
};

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function AdminUpcomingMatches() {
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<UpcomingRow[]>([]);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [matchDate, setMatchDate] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [stadiumId, setStadiumId] = useState("");
  const [homeAway, setHomeAway] = useState<"home" | "away" | "neutral">("home");
  const [phase, setPhase] = useState("");
  const [round, setRound] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [r, lookupR] = await Promise.all([
      adminFetch("/admin/matches?status=scheduled&limit=500"),
      adminFetch("/admin/lookup"),
    ]);
    if (r.ok) {
      const data = await r.json();
      setRows(Array.isArray(data.data) ? data.data : []);
    } else {
      setError("Erro ao carregar jogos futuros");
    }
    if (lookupR.ok) {
      const l = await lookupR.json();
      setLookup({
        opponents: l.opponents ?? [],
        competitions: l.competitions ?? [],
        stadiums: l.stadiums ?? [],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!matchDate || !opponentId || !competitionId) {
      setError("Data, adversário e competição são obrigatórios");
      return;
    }
    setCreating(true);
    setError("");
    const season = matchDate.slice(0, 4);
    const r = await adminFetch("/admin/matches", {
      method: "POST",
      body: JSON.stringify({
        matchDate,
        season,
        opponentId: Number(opponentId),
        competitionId: Number(competitionId),
        stadiumId: stadiumId ? Number(stadiumId) : null,
        homeAway,
        phase: phase.trim() || null,
        round: round.trim() || null,
        goalsFor: null,
        goalsAgainst: null,
        result: "unknown",
        status: "scheduled",
        isFriendly: false,
        isWalkover: false,
      }),
    });
    setCreating(false);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao criar");
      return;
    }
    const created = await r.json();
    setShowForm(false);
    setMatchDate("");
    setOpponentId("");
    setCompetitionId("");
    setStadiumId("");
    setPhase("");
    setRound("");
    setLocation(`/admin/partidas/${created.id}`);
  }

  async function remove(id: number) {
    if (!confirm("Excluir este jogo futuro?")) return;
    const r = await adminFetch(`/admin/matches/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await load();
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jogos futuros</h1>
          <p className="text-sm text-gray-500">
            {rows.length} agendado{rows.length === 1 ? "" : "s"} — o mais próximo aparece na Home
          </p>
        </div>
        <Button
          className="bg-[#1B3A6B]"
          type="button"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus size={14} className="mr-1" />
          {showForm ? "Fechar" : "Adicionar"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {showForm && lookup && (
        <form
          onSubmit={create}
          className="bg-white border rounded-lg p-4 mb-5 space-y-3 max-w-xl"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Data *
              </label>
              <Input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Mando *
              </label>
              <select
                className={sel}
                value={homeAway}
                onChange={(e) =>
                  setHomeAway(e.target.value as "home" | "away" | "neutral")
                }
              >
                <option value="home">Casa</option>
                <option value="away">Fora</option>
                <option value="neutral">Neutro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Adversário *
            </label>
            <select
              className={sel}
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
              required
            >
              <option value="">— escolher —</option>
              {lookup.opponents.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Competição *
            </label>
            <select
              className={sel}
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              required
            >
              <option value="">— escolher —</option>
              {lookup.competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Estádio
            </label>
            <select
              className={sel}
              value={stadiumId}
              onChange={(e) => setStadiumId(e.target.value)}
            >
              <option value="">— opcional —</option>
              {lookup.stadiums.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Fase
              </label>
              <Input value={phase} onChange={(e) => setPhase(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Rodada
              </label>
              <Input value={round} onChange={(e) => setRound(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="bg-[#1B3A6B]" disabled={creating}>
            {creating ? "Criando..." : "Criar jogo futuro"}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Data
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Adversário
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Competição
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Mando
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/admin/partidas/${m.id}`}
                      className="text-[#1B3A6B] hover:underline font-medium"
                    >
                      {fmtDate(m.matchDate)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{m.opponentName}</td>
                  <td className="px-4 py-2 text-gray-600">{m.competitionName}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {m.homeAway === "home"
                      ? "Casa"
                      : m.homeAway === "away"
                        ? "Fora"
                        : "Neutro"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum jogo futuro cadastrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
