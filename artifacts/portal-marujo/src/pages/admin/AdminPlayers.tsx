import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AdminEntityBadges } from "@/components/AdminEntityBadges";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";

interface Player {
  id: number;
  name: string;
  fullName: string | null;
  position: string | null;
  nationality: string | null;
  birthYear: number | null;
  birthDate: string | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;
  preferredFoot: string | null;
  heightCm: number | null;
  weightKg: number | null;
}

interface StatRow {
  id: number;
  playerId: number;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
}

const POSITIONS = [
  "Goleiro",
  "Lateral Direito",
  "Zagueiro",
  "Lateral Esquerdo",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
];

const FEET = [
  { value: "destro", label: "Destro" },
  { value: "canhoto", label: "Canhoto" },
  { value: "ambidestro", label: "Ambidestro" },
];

function PlayerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Player>;
  onSave: (data: Omit<Player, "id">) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [nationality, setNationality] = useState(initial?.nationality ?? "");
  const [birthYear, setBirthYear] = useState(String(initial?.birthYear ?? ""));
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [birthCity, setBirthCity] = useState(initial?.birthCity ?? "");
  const [birthState, setBirthState] = useState(initial?.birthState ?? "");
  const [birthCountry, setBirthCountry] = useState(initial?.birthCountry ?? "");
  const [preferredFoot, setPreferredFoot] = useState(initial?.preferredFoot ?? "");
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm != null ? String(initial.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    initial?.weightKg != null ? String(initial.weightKg) : "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        name,
        fullName: fullName.trim() || null,
        position: position || null,
        nationality: nationality || null,
        birthYear: birthYear ? parseInt(birthYear) : null,
        birthDate: birthDate.trim() || null,
        birthCity: birthCity.trim() || null,
        birthState: birthState.trim() || null,
        birthCountry: birthCountry.trim() || null,
        preferredFoot: preferredFoot || null,
        heightCm: heightCm ? parseInt(heightCm) : null,
        weightKg: weightKg ? parseInt(weightKg) : null,
      });
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nome *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Nome completo
        </label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Se diferente do nome de exibição"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Posição</label>
          <select
            className={sel}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="">–</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Nacionalidade
          </label>
          <Input
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Brasileiro"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Data de nascimento
          </label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Ano de nascimento
          </label>
          <Input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="1990"
            min={1950}
            max={2010}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Cidade nasc.
          </label>
          <Input
            value={birthCity}
            onChange={(e) => setBirthCity(e.target.value)}
            placeholder="Maceió"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Estado nasc.
          </label>
          <Input
            value={birthState}
            onChange={(e) => setBirthState(e.target.value)}
            placeholder="AL"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            País nasc.
          </label>
          <Input
            value={birthCountry}
            onChange={(e) => setBirthCountry(e.target.value)}
            placeholder="Brasil"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Pé preferencial
          </label>
          <select
            className={sel}
            value={preferredFoot}
            onChange={(e) => setPreferredFoot(e.target.value)}
          >
            <option value="">–</option>
            {FEET.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Altura (cm)
          </label>
          <Input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="180"
            min={140}
            max={220}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Peso (kg)
          </label>
          <Input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="75"
            min={40}
            max={150}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function StatForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<StatRow>;
  onSave: (data: Omit<StatRow, "id" | "playerId">) => Promise<void>;
  onCancel: () => void;
}) {
  const [season, setSeason] = useState(initial?.season ?? "");
  const [appearances, setAppearances] = useState(String(initial?.appearances ?? ""));
  const [goals, setGoals] = useState(String(initial?.goals ?? ""));
  const [assists, setAssists] = useState(String(initial?.assists ?? ""));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        season,
        appearances: parseInt(appearances) || 0,
        goals: parseInt(goals) || 0,
        assists: parseInt(assists) || 0,
      });
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Temporada *</label>
          <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2023" required />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Partidas</label>
          <Input type="number" value={appearances} onChange={(e) => setAppearances(e.target.value)} min={0} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Gols</label>
          <Input type="number" value={goals} onChange={(e) => setGoals(e.target.value)} min={0} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Assistências</label>
          <Input type="number" value={assists} onChange={(e) => setAssists(e.target.value)} min={0} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statsMap, setStatsMap] = useState<Record<number, StatRow[]>>({});
  const [statDialog, setStatDialog] = useState<{ playerId: number; stat?: StatRow } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/players");
    if (r.ok) setPlayers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadStats(playerId: number) {
    if (statsMap[playerId]) return;
    const r = await adminFetch(`/admin/players/${playerId}/stats`);
    if (r.ok) {
      const data = await r.json();
      setStatsMap((prev) => ({ ...prev, [playerId]: data }));
    }
  }

  function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadStats(id);
    }
  }

  function selectPlayerFromSearch(id: number) {
    setExpandedId(id);
    loadStats(id);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-player-row="${id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function savePlayer(data: Omit<Player, "id">) {
    const r = await adminFetch(
      editPlayer ? `/admin/players/${editPlayer.id}` : "/admin/players",
      { method: editPlayer ? "PUT" : "POST", body: JSON.stringify(data) }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro");
    }
    setDialogOpen(false);
    setEditPlayer(null);
    await load();
  }

  async function deletePlayer(id: number) {
    if (!confirm("Excluir este jogador e todas as suas estatísticas?")) return;
    await adminFetch(`/admin/players/${id}`, { method: "DELETE" });
    await load();
  }

  async function saveStat(playerId: number, data: Omit<StatRow, "id" | "playerId">, statId?: number) {
    const r = await adminFetch(
      statId ? `/admin/player-stats/${statId}` : `/admin/players/${playerId}/stats`,
      { method: statId ? "PUT" : "POST", body: JSON.stringify(data) }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro");
    }
    setStatDialog(null);
    const r2 = await adminFetch(`/admin/players/${playerId}/stats`);
    if (r2.ok) {
      const stats = await r2.json();
      setStatsMap((prev) => ({ ...prev, [playerId]: stats }));
    }
  }

  async function deleteStat(playerId: number, statId: number) {
    if (!confirm("Excluir esta temporada?")) return;
    await adminFetch(`/admin/player-stats/${statId}`, { method: "DELETE" });
    const r = await adminFetch(`/admin/players/${playerId}/stats`);
    if (r.ok) {
      const stats = await r.json();
      setStatsMap((prev) => ({ ...prev, [playerId]: stats }));
    }
  }

  const filtered = players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jogadores</h1>
          <p className="text-sm text-gray-500">{players.length} cadastrados</p>
        </div>
        <Button
          className="bg-[#1B3A6B]"
          onClick={() => { setEditPlayer(null); setDialogOpen(true); }}
        >
          <Plus size={14} className="mr-1" /> Adicionar
        </Button>
      </div>

      <AdminEntitySearch
        items={players.map((p) => ({
          id: p.id,
          name: p.name,
          subtitle: [p.position, p.nationality].filter(Boolean).join(" · ") || null,
        }))}
        placeholder="Buscar jogador…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => selectPlayerFromSearch(item.id)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Posição</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Nacionalidade</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Nasc.</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <>
                  <tr key={player.id} className="border-b hover:bg-gray-50" data-player-row={player.id}>
                    <td className="px-4 py-2 font-medium">{player.name}</td>
                    <td className="px-4 py-2 text-gray-600">{player.position ?? "–"}</td>
                    <td className="px-4 py-2 text-gray-600">{player.nationality ?? "–"}</td>
                    <td className="px-4 py-2 text-gray-600">{player.birthYear ?? "–"}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleExpand(player.id)}
                          className="p-1 text-gray-400 hover:text-[#1B3A6B] rounded"
                          title="Ver/editar temporadas"
                        >
                          {expandedId === player.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button
                          onClick={() => { setEditPlayer(player); setDialogOpen(true); }}
                          className="p-1 text-gray-400 hover:text-[#1B3A6B] rounded"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deletePlayer(player.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === player.id && (
                    <tr key={`stats-${player.id}`}>
                      <td colSpan={5} className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase">Estatísticas por Temporada</span>
                          <button
                            onClick={() => setStatDialog({ playerId: player.id })}
                            className="text-xs text-[#1B3A6B] font-medium hover:underline flex items-center gap-1"
                          >
                            <Plus size={11} /> Adicionar temporada
                          </button>
                        </div>
                        {!statsMap[player.id] ? (
                          <p className="text-xs text-gray-400">Carregando...</p>
                        ) : statsMap[player.id].length === 0 ? (
                          <p className="text-xs text-gray-400">Nenhuma temporada cadastrada</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 border-b">
                                <th className="text-left py-1">Temporada</th>
                                <th className="text-right py-1">Partidas</th>
                                <th className="text-right py-1">Gols</th>
                                <th className="text-right py-1">Assist.</th>
                                <th className="py-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {statsMap[player.id].map((stat) => (
                                <tr key={stat.id} className="border-b border-gray-100">
                                  <td className="py-1 font-medium">{stat.season}</td>
                                  <td className="py-1 text-right">{stat.appearances}</td>
                                  <td className="py-1 text-right">{stat.goals}</td>
                                  <td className="py-1 text-right">{stat.assists}</td>
                                  <td className="py-1">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        onClick={() => setStatDialog({ playerId: player.id, stat })}
                                        className="p-0.5 text-gray-400 hover:text-[#1B3A6B]"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => deleteStat(player.id, stat.id)}
                                        className="p-0.5 text-gray-400 hover:text-red-600"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <AdminEntityBadges entityType="player" entityId={player.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum jogador encontrado</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditPlayer(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPlayer ? "Editar Jogador" : "Novo Jogador"}</DialogTitle>
          </DialogHeader>
          <PlayerForm
            initial={editPlayer ?? undefined}
            onSave={savePlayer}
            onCancel={() => { setDialogOpen(false); setEditPlayer(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!statDialog} onOpenChange={(v) => { if (!v) setStatDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statDialog?.stat ? "Editar Temporada" : "Nova Temporada"}</DialogTitle>
          </DialogHeader>
          {statDialog && (
            <StatForm
              initial={statDialog.stat}
              onSave={(data) => saveStat(statDialog.playerId, data, statDialog.stat?.id)}
              onCancel={() => setStatDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
