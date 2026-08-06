import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { includesFolded } from "@/lib/accent-fold";

type PlayerOpt = { id: number; name: string };

const TRANSFER_TYPE_PRESETS = [
  "empréstimo",
  "definitiva",
  "fim de contrato",
  "retorno de empréstimo",
] as const;

export default function AdminTransferDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo" || !params.id;
  const transferId = isNew ? NaN : Number(params.id);

  const [players, setPlayers] = useState<PlayerOpt[]>([]);
  const [playerId, setPlayerId] = useState<number | "">("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [club, setClub] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [season, setSeason] = useState("");
  const [transferType, setTransferType] = useState("");
  const [transferTypeOther, setTransferTypeOther] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPlayers = useCallback(async () => {
    const r = await adminFetch("/admin/players");
    if (r.ok) {
      const data = (await r.json()) as { id: number; name: string }[];
      setPlayers(data.map((p) => ({ id: p.id, name: p.name })));
    }
  }, []);

  const load = useCallback(async () => {
    if (isNew || Number.isNaN(transferId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/transfers/${transferId}`);
    if (!r.ok) {
      setError("Transferência não encontrada");
      setLoading(false);
      return;
    }
    const data = await r.json();
    setPlayerId(data.playerId);
    setPlayerSearch(data.playerName ?? "");
    setDirection(data.direction === "out" ? "out" : "in");
    setClub(data.club ?? "");
    setTransferDate(data.transferDate ?? "");
    setSeason(data.season ?? "");
    setTransferType(data.transferType ?? "");
    setTransferTypeOther(
      Boolean(
        data.transferType &&
          !(TRANSFER_TYPE_PRESETS as readonly string[]).includes(data.transferType),
      ),
    );
    setNotes(data.notes ?? "");
    setLoading(false);
  }, [isNew, transferId]);

  useEffect(() => {
    loadPlayers();
    load();
  }, [loadPlayers, load]);

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim();
    if (q.length < 1) return players.slice(0, 30);
    return players
      .filter((p) => includesFolded(p.name, q))
      .slice(0, 30);
  }, [players, playerSearch]);

  const transferTypeSelect = transferTypeOther
    ? "__other__"
    : transferType;

  async function createPlayerQuick() {
    const name = newPlayerName.trim();
    if (!name) return;
    const r = await adminFetch("/admin/players", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao criar jogador");
      return;
    }
    const created = (await r.json()) as { id: number; name: string };
    setPlayers((prev) => [...prev, { id: created.id, name: created.name }]);
    setPlayerId(created.id);
    setPlayerSearch(created.name);
    setNewPlayerName("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId) {
      setError("Selecione um jogador");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        playerId: Number(playerId),
        direction,
        club: club.trim() || null,
        transferDate: transferDate.trim() || null,
        season: season.trim(),
        transferType: transferType.trim() || null,
        notes: notes.trim() || null,
      };
      const r = await adminFetch(
        isNew ? "/admin/transfers" : `/admin/transfers/${transferId}`,
        {
          method: isNew ? "POST" : "PUT",
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      const saved = await r.json();
      if (isNew) setLocation(`/admin/transferencias/${saved.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Excluir esta transferência?")) return;
    const r = await adminFetch(`/admin/transfers/${transferId}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    setLocation("/admin/transferencias");
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/transferencias"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={13} className="mr-0.5" /> Transferências
      </Link>

      <h1 className="text-xl font-bold text-gray-900">
        {isNew ? "Nova transferência" : "Editar transferência"}
      </h1>

      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Jogador *
          </label>
          <Input
            value={playerSearch}
            onChange={(e) => {
              setPlayerSearch(e.target.value);
              setPlayerId("");
            }}
            placeholder="Buscar jogador…"
          />
          {playerSearch.trim() && !playerId && (
            <ul className="mt-1 border rounded max-h-40 overflow-auto bg-white text-sm">
              {filteredPlayers.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
                    onClick={() => {
                      setPlayerId(p.id);
                      setPlayerSearch(p.name);
                    }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
              {filteredPlayers.length === 0 && (
                <li className="px-3 py-2 text-gray-400">Nenhum jogador</li>
              )}
            </ul>
          )}
          {playerId && (
            <p className="text-xs text-green-700 mt-1">
              Selecionado: ID {playerId}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Criar jogador novo (nome)"
            />
            <Button type="button" variant="outline" onClick={createPlayerQuick}>
              Criar
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Direção *
          </label>
          <select
            className={sel}
            value={direction}
            onChange={(e) => setDirection(e.target.value as "in" | "out")}
          >
            <option value="in">Chegada (in)</option>
            <option value="out">Saída (out)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Clube {direction === "in" ? "(origem)" : "(destino)"}
          </label>
          <Input value={club} onChange={(e) => setClub(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Temporada *
            </label>
            <Input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="2027"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Data
            </label>
            <Input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Tipo
          </label>
          <select
            className={sel}
            value={transferTypeSelect}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__other__") {
                setTransferTypeOther(true);
                if ((TRANSFER_TYPE_PRESETS as readonly string[]).includes(transferType)) {
                  setTransferType("");
                }
                return;
              }
              setTransferTypeOther(false);
              setTransferType(v);
            }}
          >
            <option value="">— sem tipo —</option>
            <option value="empréstimo">Empréstimo</option>
            <option value="definitiva">Definitiva</option>
            <option value="fim de contrato">Fim de contrato</option>
            <option value="retorno de empréstimo">Retorno de empréstimo</option>
            <option value="__other__">Outro…</option>
          </select>
          {transferTypeOther && (
            <Input
              className="mt-2"
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              placeholder="Tipo personalizado…"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            Use “Empréstimo” para listar em Jogadores → Emprestados.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Observações
          </label>
          <textarea
            className={sel + " min-h-[80px]"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
          {!isNew && (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
