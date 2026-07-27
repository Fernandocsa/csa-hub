import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, ClipboardList } from "lucide-react";
import { ResultBadge } from "@/components/ui/result-badge";
import { Link } from "wouter";

interface LookupData {
  opponents: { id: number; name: string }[];
  competitions: { id: number; name: string }[];
  stadiums: { id: number; name: string }[];
  managers: { id: number; name: string }[];
}

interface MatchRow {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  attendance: number | null;
  scorers: string | null;
  opponentId: number;
  opponentName: string;
  competitionId: number;
  competitionName: string;
  stadiumId: number | null;
  stadiumName: string | null;
  managerId: number | null;
  managerName: string | null;
}

interface MatchFormData {
  matchDate: string;
  season: string;
  opponentId: number;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  competitionId: number;
  stadiumId: number | null;
  managerId: number | null;
  attendance: number | null;
  scorers: string;
}

function MatchForm({
  initial,
  lookup,
  onSave,
  onCancel,
}: {
  initial?: Partial<MatchRow>;
  lookup: LookupData;
  onSave: (data: MatchFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [matchDate, setMatchDate] = useState(initial?.matchDate ?? "");
  const [season, setSeason] = useState(initial?.season ?? "");
  const [opponentId, setOpponentId] = useState(String(initial?.opponentId ?? ""));
  const [goalsFor, setGoalsFor] = useState(String(initial?.goalsFor ?? "0"));
  const [goalsAgainst, setGoalsAgainst] = useState(String(initial?.goalsAgainst ?? "0"));
  const [result, setResult] = useState(initial?.result ?? "");
  const [homeAway, setHomeAway] = useState(initial?.homeAway ?? "home");
  const [competitionId, setCompetitionId] = useState(String(initial?.competitionId ?? ""));
  const [stadiumId, setStadiumId] = useState(String(initial?.stadiumId ?? ""));
  const [managerId, setManagerId] = useState(String(initial?.managerId ?? ""));
  const [attendance, setAttendance] = useState(String(initial?.attendance ?? ""));
  const [scorers, setScorers] = useState(initial?.scorers ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // auto-compute result from goals
  useEffect(() => {
    if (!result) {
      const gf = parseInt(goalsFor);
      const ga = parseInt(goalsAgainst);
      if (!isNaN(gf) && !isNaN(ga)) {
        setResult(gf > ga ? "win" : gf < ga ? "loss" : "draw");
      }
    }
  }, [goalsFor, goalsAgainst]);

  // auto-fill season from date
  useEffect(() => {
    if (matchDate && !season) {
      setSeason(matchDate.substring(0, 4));
    }
  }, [matchDate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        matchDate,
        season,
        opponentId: parseInt(opponentId),
        goalsFor: parseInt(goalsFor) || 0,
        goalsAgainst: parseInt(goalsAgainst) || 0,
        result,
        homeAway,
        competitionId: parseInt(competitionId),
        stadiumId: stadiumId ? parseInt(stadiumId) : null,
        managerId: managerId ? parseInt(managerId) : null,
        attendance: attendance ? parseInt(attendance) : null,
        scorers: scorers || null,
      });
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";

  return (
    <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Data *</label>
          <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Temporada *</label>
          <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2023" required />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Adversário *</label>
        <select className={sel} value={opponentId} onChange={(e) => setOpponentId(e.target.value)} required>
          <option value="">Selecionar...</option>
          {lookup.opponents.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Gols Pró</label>
          <Input type="number" min={0} value={goalsFor} onChange={(e) => setGoalsFor(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Gols Contra</label>
          <Input type="number" min={0} value={goalsAgainst} onChange={(e) => setGoalsAgainst(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Resultado</label>
          <select className={sel} value={result} onChange={(e) => setResult(e.target.value)} required>
            <option value="">Auto</option>
            <option value="win">Vitória</option>
            <option value="draw">Empate</option>
            <option value="loss">Derrota</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Mando</label>
          <select className={sel} value={homeAway} onChange={(e) => setHomeAway(e.target.value)}>
            <option value="home">Casa</option>
            <option value="away">Fora</option>
            <option value="neutral">Neutro</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Competição *</label>
          <select className={sel} value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} required>
            <option value="">Selecionar...</option>
            {lookup.competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Estádio</label>
          <select className={sel} value={stadiumId} onChange={(e) => setStadiumId(e.target.value)}>
            <option value="">–</option>
            {lookup.stadiums.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Técnico</label>
          <select className={sel} value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">–</option>
            {lookup.managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Público</label>
          <Input type="number" min={0} value={attendance} onChange={(e) => setAttendance(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Artilheiros</label>
          <Input value={scorers} onChange={(e) => setScorers(e.target.value)} placeholder="Nome1, Nome2" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<MatchRow | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch(`/admin/matches?limit=500&offset=0`);
    if (r.ok) {
      const data = await r.json();
      setMatches(data.data);
      setTotal(data.total);
    }
    setLoading(false);
  }, []);

  const loadLookup = useCallback(async () => {
    const r = await adminFetch("/admin/lookup");
    if (r.ok) setLookup(await r.json());
  }, []);

  useEffect(() => { load(); loadLookup(); }, [load, loadLookup]);

  async function saveMatch(data: MatchFormData) {
    const r = await adminFetch(
      editMatch ? `/admin/matches/${editMatch.id}` : "/admin/matches",
      { method: editMatch ? "PUT" : "POST", body: JSON.stringify(data) }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro");
    }
    setDialogOpen(false);
    setEditMatch(null);
    await load();
  }

  async function deleteMatch(id: number) {
    if (!confirm("Excluir esta partida?")) return;
    await adminFetch(`/admin/matches/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = matches.filter((m) =>
    !search ||
    m.opponentName.toLowerCase().includes(search.toLowerCase()) ||
    m.season.includes(search) ||
    m.competitionName.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function homeAwayLabel(v: string) {
    return v === "home" ? "Casa" : v === "away" ? "Fora" : "Neutro";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Partidas</h1>
          <p className="text-sm text-gray-500">{total} registradas</p>
        </div>
        <Button
          className="bg-[#1B3A6B]"
          onClick={() => { setEditMatch(null); setDialogOpen(true); }}
          disabled={!lookup}
        >
          <Plus size={14} className="mr-1" /> Adicionar
        </Button>
      </div>

      <Input
        placeholder="Buscar adversário, temporada ou competição..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        className="mb-4 max-w-sm"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Adversário</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Res.</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Placar</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Temp.</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Mando</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Competição</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{m.matchDate}</td>
                  <td className="px-3 py-2 font-medium">{m.opponentName}</td>
                  <td className="px-3 py-2 text-center">
                    <ResultBadge result={m.result as "win" | "draw" | "loss"} />
                  </td>
                  <td className="px-3 py-2 text-center font-mono">{m.goalsFor}–{m.goalsAgainst}</td>
                  <td className="px-3 py-2 text-gray-600">{m.season}</td>
                  <td className="px-3 py-2 text-gray-600">{homeAwayLabel(m.homeAway)}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{m.competitionName}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/partidas/${m.id}/ficha`}
                        className="p-1 text-gray-400 hover:text-[#1B3A6B] rounded"
                        title="Ficha CSA (escalação, gols, cartões)"
                      >
                        <ClipboardList size={13} />
                      </Link>
                      <button
                        onClick={() => { setEditMatch(m); setDialogOpen(true); }}
                        className="p-1 text-gray-400 hover:text-[#1B3A6B] rounded"
                        disabled={!lookup}
                        title="Editar dados da partida"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteMatch(m.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginated.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma partida encontrada</p>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-gray-500">
              <span>{filtered.length} resultados</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Anterior
                </Button>
                <span>Pág. {page + 1} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditMatch(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMatch ? "Editar Partida" : "Nova Partida"}</DialogTitle>
          </DialogHeader>
          {lookup && (
            <MatchForm
              initial={editMatch ?? undefined}
              lookup={lookup}
              onSave={saveMatch}
              onCancel={() => { setDialogOpen(false); setEditMatch(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
