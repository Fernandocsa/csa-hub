import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { useAdminReturnTo, withAdminFrom } from "@/hooks/useAdminReturnTo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { AdminEntityBadges } from "@/components/AdminEntityBadges";
import { EntityPhoto } from "@/components/EntityPhoto";
import { AdminNameDuplicateWarning } from "@/components/AdminNameDuplicateWarning";

export interface Manager {
  id: number;
  name: string;
  fullName: string | null;
  nationality: string | null;
  birthDate: string | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;
  isDeceased: boolean;
  photoUrl: string | null;
  playerId: number | null;
  playerName?: string | null;
  verificationStatus: "verified" | "unverified";
  verifiedAt: string | null;
  verifiedBy: string | null;
  startYear: number | null;
  endYear: number | null;
  storedGames: number | null;
  storedWins: number | null;
  storedDraws: number | null;
  storedLosses: number | null;
  storedGoalsFor: number | null;
  storedGoalsAgainst: number | null;
  statsSource: "manual" | "calculated" | null;
  statsRecalculatedAt: string | null;
}

type ManagerPayload = {
  name: string;
  fullName: string | null;
  nationality: string | null;
  birthDate: string | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;
  isDeceased: boolean;
  photoUrl: string | null;
  playerId: number | null;
  verificationStatus: "verified" | "unverified";
  verifiedBy: string | null;
};

interface SeasonStatRow {
  id: number;
  managerId: number;
  season: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  statsSource: string;
  statsRecalculatedAt: string | null;
}

type TabId = "perfil" | "temporadas" | "badges";

type StatDraft = {
  games: string;
  wins: string;
  draws: string;
  losses: string;
  goalsFor: string;
  goalsAgainst: string;
};

function draftsFromStats(rows: SeasonStatRow[]): Record<number, StatDraft> {
  const next: Record<number, StatDraft> = {};
  for (const s of rows) {
    next[s.id] = {
      games: String(s.games ?? 0),
      wins: String(s.wins ?? 0),
      draws: String(s.draws ?? 0),
      losses: String(s.losses ?? 0),
      goalsFor: String(s.goalsFor ?? 0),
      goalsAgainst: String(s.goalsAgainst ?? 0),
    };
  }
  return next;
}

function sourceLabel(source: string, recalculatedAt: string | null): string {
  if (source === "calculated") {
    return recalculatedAt
      ? `Calc. ${new Date(recalculatedAt).toLocaleDateString("pt-BR")}`
      : "Calculado";
  }
  if (source === "manual") return "Manual";
  return "—";
}

function ManagerProfileForm({
  initial,
  onSave,
  isNew,
  cancelHref = "/admin/tecnicos",
  onMerged,
}: {
  initial?: Partial<Manager>;
  onSave: (data: ManagerPayload) => Promise<void>;
  isNew: boolean;
  cancelHref?: string;
  onMerged?: (result: { keptId: number; removedId: number }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [nationality, setNationality] = useState(initial?.nationality ?? "Brasil");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [birthCity, setBirthCity] = useState(initial?.birthCity ?? "");
  const [birthState, setBirthState] = useState(initial?.birthState ?? "");
  const [birthCountry, setBirthCountry] = useState(initial?.birthCountry ?? "");
  const [isDeceased, setIsDeceased] = useState(initial?.isDeceased ?? false);
  const [isVerified, setIsVerified] = useState(initial?.verificationStatus === "verified");
  const [verifiedBy, setVerifiedBy] = useState(initial?.verifiedBy ?? "");
  const [playerId, setPlayerId] = useState(
    initial?.playerId != null ? String(initial.playerId) : "",
  );
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerOptions, setPlayerOptions] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameBlocked, setNameBlocked] = useState(false);

  useEffect(() => {
    setName(initial?.name ?? "");
    setFullName(initial?.fullName ?? "");
    setPhotoUrl(initial?.photoUrl ?? "");
    setNationality(initial?.nationality ?? "Brasil");
    setBirthDate(initial?.birthDate ?? "");
    setBirthCity(initial?.birthCity ?? "");
    setBirthState(initial?.birthState ?? "");
    setBirthCountry(initial?.birthCountry ?? "");
    setIsDeceased(initial?.isDeceased ?? false);
    setIsVerified(initial?.verificationStatus === "verified");
    setVerifiedBy(initial?.verifiedBy ?? "");
    setPlayerId(initial?.playerId != null ? String(initial.playerId) : "");
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await adminFetch("/admin/players");
      if (!r.ok || cancelled) return;
      const rows = (await r.json()) as { id: number; name: string }[];
      if (!cancelled) setPlayerOptions(rows.map((p) => ({ id: p.id, name: p.name })));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return playerOptions.slice(0, 30);
    return playerOptions
      .filter((p) => p.name.toLowerCase().includes(q) || String(p.id) === q)
      .slice(0, 30);
  }, [playerOptions, playerSearch]);

  const selectedPlayerName =
    playerId &&
    (playerOptions.find((p) => String(p.id) === playerId)?.name ??
      initial?.playerName ??
      null);

  const isBrazil =
    !birthCountry.trim() ||
    /^(br|bra|brasil|brazil)$/i.test(birthCountry.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nameBlocked) {
      setError("Já existe técnico com esse nome completo. Abra o perfil existente para editar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const parsedPlayerId = playerId.trim() ? parseInt(playerId.trim(), 10) : null;
      if (playerId.trim() && (!Number.isInteger(parsedPlayerId) || (parsedPlayerId ?? 0) < 1)) {
        throw new Error("ID de jogador inválido");
      }
      await onSave({
        name,
        fullName: fullName.trim() || null,
        nationality: nationality.trim() || null,
        birthDate: birthDate.trim() || null,
        birthCity: birthCity.trim() || null,
        birthState: isBrazil ? birthState.trim().toUpperCase() || null : null,
        birthCountry: birthCountry.trim() || null,
        isDeceased,
        photoUrl: photoUrl.trim() || null,
        playerId: parsedPlayerId,
        verificationStatus: isVerified ? "verified" : "unverified",
        verifiedBy: isVerified ? verifiedBy.trim() || null : null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-2xl">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Foto de perfil
        </label>
        <div className="flex items-start gap-3">
          <EntityPhoto
            url={photoUrl.trim() || null}
            name={name || "Técnico"}
            size="md"
            label="Foto do técnico"
          />
          <div className="flex-1 min-w-0">
            <Input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://… ou /managers/id.jpg"
            />
            <p className="text-xs text-gray-400 mt-1">
              URL HTTPS ou caminho local em public. Sem upload nesta tela.
            </p>
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Nome *
        </label>
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
      <AdminNameDuplicateWarning
        kind="manager"
        name={name}
        fullName={fullName}
        excludeId={initial?.id ?? null}
        hrefForId={(id) => `/admin/tecnicos/${id}`}
        onBlockChange={setNameBlocked}
        merge={
          !isNew && initial?.id != null && onMerged
            ? {
                keepId: initial.id,
                keepName: name.trim() || initial.name || `Técnico #${initial.id}`,
                endpoint: "/admin/managers/merge",
                onMerged,
              }
            : undefined
        }
      />
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Nacionalidade
        </label>
        <Input
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="Brasil"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Data de nascimento
        </label>
        <Input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="max-w-xs"
        />
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
            País nasc.
          </label>
          <Input
            value={birthCountry}
            onChange={(e) => setBirthCountry(e.target.value)}
            placeholder="Brasil / BRA"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Estado (UF)
          </label>
          <Input
            value={birthState}
            onChange={(e) => setBirthState(e.target.value)}
            placeholder="AL"
            disabled={!isBrazil}
            maxLength={2}
          />
          {!isBrazil && (
            <p className="text-xs text-gray-400 mt-1">UF só para nascimento no Brasil</p>
          )}
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={isDeceased}
          onChange={(e) => setIsDeceased(e.target.checked)}
          className="rounded border-gray-300"
        />
        Falecido
      </label>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Verificação</h3>
            <p className="text-xs text-gray-500">
              {initial?.verificationStatus === "verified" && initial?.verifiedAt
                ? `Atualmente verificado em ${new Date(initial.verifiedAt).toLocaleString("pt-BR")}${
                    initial?.verifiedBy ? ` por ${initial.verifiedBy}` : ""
                  }`
                : "Atualmente não verificado"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsVerified((value) => !value)}
          >
            {isVerified ? "Remover verificação" : "Marcar como Verificado"}
          </Button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Verificado por
          </label>
          <Input
            value={verifiedBy}
            onChange={(e) => setVerifiedBy(e.target.value)}
            placeholder="Portal Marujo"
            disabled={!isVerified}
          />
          <p className="text-xs text-gray-400 mt-1">
            A alteração de verificação só é gravada ao salvar o perfil.
          </p>
        </div>
      </div>
      <div className="border rounded p-3 space-y-2 bg-gray-50">
        <label className="text-xs font-semibold text-gray-500 uppercase block">
          Vínculo com jogador (ex-jogador → técnico)
        </label>
        <Input
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          placeholder="Buscar jogador por nome ou ID…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="ID do jogador"
            className="w-32"
          />
          {selectedPlayerName ? (
            <span className="text-sm text-gray-700">
              Selecionado: <strong>{selectedPlayerName}</strong>
            </span>
          ) : (
            <span className="text-xs text-gray-400">Nenhum jogador vinculado</span>
          )}
          {playerId && (
            <Button type="button" variant="outline" size="sm" onClick={() => setPlayerId("")}>
              Limpar
            </Button>
          )}
        </div>
        {playerSearch.trim() && filteredPlayers.length > 0 && (
          <ul className="max-h-40 overflow-y-auto border rounded bg-white text-sm divide-y">
            {filteredPlayers.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 hover:bg-blue-50"
                  onClick={() => {
                    setPlayerId(String(p.id));
                    setPlayerSearch("");
                  }}
                >
                  #{p.id} — {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving || nameBlocked}>
          {saving ? "Salvando..." : isNew ? "Criar técnico" : "Salvar"}
        </Button>
        <Link href={cancelHref}>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function SeasonStatForm({
  onSave,
  onCancel,
}: {
  onSave: (data: {
    season: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [season, setSeason] = useState("");
  const [games, setGames] = useState("0");
  const [wins, setWins] = useState("0");
  const [draws, setDraws] = useState("0");
  const [losses, setLosses] = useState("0");
  const [goalsFor, setGoalsFor] = useState("0");
  const [goalsAgainst, setGoalsAgainst] = useState("0");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        season: season.trim(),
        games: parseInt(games, 10) || 0,
        wins: parseInt(wins, 10) || 0,
        draws: parseInt(draws, 10) || 0,
        losses: parseInt(losses, 10) || 0,
        goalsFor: parseInt(goalsFor, 10) || 0,
        goalsAgainst: parseInt(goalsAgainst, 10) || 0,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Temporada *
        </label>
        <Input
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          placeholder="2023"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Jogos", games, setGames],
            ["Vitórias", wins, setWins],
            ["Empates", draws, setDraws],
            ["Derrotas", losses, setLosses],
            ["Gols pró", goalsFor, setGoalsFor],
            ["Gols contra", goalsAgainst, setGoalsAgainst],
          ] as const
        ).map(([label, value, setter]) => (
          <div key={label}>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              {label}
            </label>
            <Input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setter(e.target.value)}
            />
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
          {saving ? "Salvando..." : "Adicionar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminManagerDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { returnTo, label: returnLabel } = useAdminReturnTo("/admin/tecnicos");
  const isNew = !params.id;
  const managerId = params.id ? Number(params.id) : NaN;

  const [manager, setManager] = useState<Manager | null>(null);
  const [stats, setStats] = useState<SeasonStatRow[]>([]);
  const [statDrafts, setStatDrafts] = useState<Record<number, StatDraft>>({});
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState<TabId>("perfil");
  const [statDialog, setStatDialog] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsSavedMsg, setStatsSavedMsg] = useState("");
  const [recalculating, setRecalculating] = useState(false);

  const loadManager = useCallback(async () => {
    if (isNew || !managerId || Number.isNaN(managerId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/managers/${managerId}`);
    if (!r.ok) {
      setError("Técnico não encontrado");
      setManager(null);
      setLoading(false);
      return;
    }
    setManager(await r.json());
    setLoading(false);
  }, [isNew, managerId]);

  const loadStats = useCallback(async () => {
    if (isNew || !managerId || Number.isNaN(managerId)) return;
    const r = await adminFetch(`/admin/managers/${managerId}/stats`);
    if (r.ok) {
      const rows = (await r.json()) as SeasonStatRow[];
      setStats(rows);
      setStatDrafts(draftsFromStats(rows));
    }
  }, [isNew, managerId]);

  useEffect(() => {
    loadManager();
  }, [loadManager]);

  useEffect(() => {
    if (!isNew) loadStats();
  }, [isNew, loadStats]);

  const dirtyStats = useMemo(() => {
    return stats.filter((s) => {
      const d = statDrafts[s.id];
      if (!d) return false;
      return (
        (parseInt(d.games, 10) || 0) !== s.games ||
        (parseInt(d.wins, 10) || 0) !== s.wins ||
        (parseInt(d.draws, 10) || 0) !== s.draws ||
        (parseInt(d.losses, 10) || 0) !== s.losses ||
        (parseInt(d.goalsFor, 10) || 0) !== s.goalsFor ||
        (parseInt(d.goalsAgainst, 10) || 0) !== s.goalsAgainst
      );
    });
  }, [stats, statDrafts]);

  const statsDirty = dirtyStats.length > 0;

  const draftTotals = useMemo(() => {
    const t = { games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    for (const s of stats) {
      const d = statDrafts[s.id];
      t.games += parseInt(d?.games ?? String(s.games), 10) || 0;
      t.wins += parseInt(d?.wins ?? String(s.wins), 10) || 0;
      t.draws += parseInt(d?.draws ?? String(s.draws), 10) || 0;
      t.losses += parseInt(d?.losses ?? String(s.losses), 10) || 0;
      t.goalsFor += parseInt(d?.goalsFor ?? String(s.goalsFor), 10) || 0;
      t.goalsAgainst += parseInt(d?.goalsAgainst ?? String(s.goalsAgainst), 10) || 0;
    }
    return t;
  }, [stats, statDrafts]);

  useEffect(() => {
    if (!statsDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [statsDirty]);

  function requestTabChange(next: TabId) {
    if (next === tab) return;
    if (statsDirty && tab === "temporadas") {
      if (!confirm("Há alterações não salvas nas temporadas. Deseja sair sem salvar?")) {
        return;
      }
      setStatDrafts(draftsFromStats(stats));
      setStatsError("");
    }
    setTab(next);
  }

  async function saveManager(data: ManagerPayload) {
    const r = await adminFetch(
      isNew ? "/admin/managers" : `/admin/managers/${managerId}`,
      { method: isNew ? "POST" : "PUT", body: JSON.stringify(data) },
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro");
    }
    const saved = (await r.json()) as Manager;
    if (isNew) {
      setLocation(`/admin/tecnicos/${saved.id}`);
      return;
    }
    setManager(saved);
    setSavedMsg("Perfil salvo.");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  function handleMerged({ keptId, removedId }: { keptId: number; removedId: number }) {
    if (keptId === managerId) {
      setSavedMsg(`Duplicado #${removedId} absorvido neste perfil.`);
      setTimeout(() => setSavedMsg(""), 4000);
      void loadManager();
      void loadStats();
      return;
    }
    setLocation(withAdminFrom(`/admin/tecnicos/${keptId}`, returnTo));
  }

  async function addStat(data: {
    season: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }) {
    const r = await adminFetch(`/admin/managers/${managerId}/stats`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro");
    }
    setStatDialog(false);
    await loadStats();
    await loadManager();
  }

  async function saveStatsBulk() {
    if (!statsDirty) return;
    setSavingStats(true);
    setStatsError("");
    setStatsSavedMsg("");
    try {
      const payload = dirtyStats.map((s) => {
        const d = statDrafts[s.id];
        return {
          id: s.id,
          games: parseInt(d.games, 10) || 0,
          wins: parseInt(d.wins, 10) || 0,
          draws: parseInt(d.draws, 10) || 0,
          losses: parseInt(d.losses, 10) || 0,
          goalsFor: parseInt(d.goalsFor, 10) || 0,
          goalsAgainst: parseInt(d.goalsAgainst, 10) || 0,
        };
      });
      const r = await adminFetch(`/admin/managers/${managerId}/stats/bulk`, {
        method: "PUT",
        body: JSON.stringify({ stats: payload }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      await loadStats();
      await loadManager();
      setStatsSavedMsg("Temporadas salvas.");
      setTimeout(() => setStatsSavedMsg(""), 2500);
    } catch (e: unknown) {
      setStatsError(e instanceof Error ? e.message : "Erro ao salvar");
    }
    setSavingStats(false);
  }

  async function deleteStat(statId: number) {
    if (statsDirty) {
      if (
        !confirm(
          "Há alterações não salvas. Excluir esta temporada? As outras edições continuam no formulário.",
        )
      ) {
        return;
      }
    }
    if (!confirm("Excluir esta temporada?")) return;
    await adminFetch(`/admin/manager-stats/${statId}`, { method: "DELETE" });
    await loadStats();
    await loadManager();
  }

  async function recalculate() {
    if (
      !confirm(
        "Atualiza temporadas calculadas a partir das partidas. Linhas editadas manualmente são preservadas. Continuar?",
      )
    ) {
      return;
    }
    setRecalculating(true);
    setStatsError("");
    try {
      const r = await adminFetch(`/admin/managers/${managerId}/recalculate-stats`, {
        method: "POST",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao recalcular");
      }
      await loadStats();
      await loadManager();
      setStatsSavedMsg("Recálculo concluído.");
      setTimeout(() => setStatsSavedMsg(""), 2500);
    } catch (e: unknown) {
      setStatsError(e instanceof Error ? e.message : "Erro ao recalcular");
    }
    setRecalculating(false);
  }

  function updateDraft(statId: number, field: keyof StatDraft, value: string) {
    setStatDrafts((prev) => ({
      ...prev,
      [statId]: { ...prev[statId], [field]: value },
    }));
    setStatsSavedMsg("");
  }

  const tabs: { id: TabId; label: string; locked?: boolean; count?: number }[] = [
    { id: "perfil", label: "Perfil" },
    {
      id: "temporadas",
      label: "Temporadas",
      locked: isNew,
      count: isNew ? undefined : stats.length,
    },
    { id: "badges", label: "Badges", locked: isNew },
  ];

  if (!isNew && loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && (error || !manager)) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "Técnico não encontrado"}</p>
        <Link
          href={returnTo}
          className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block"
        >
          Voltar
        </Link>
      </div>
    );
  }

  const periodLabel =
    manager && (manager.startYear != null || manager.endYear != null)
      ? `${manager.startYear ?? "?"}–${manager.endYear ?? "?"}`
      : null;

  return (
    <div className="space-y-4 pb-16">
      <div>
        <Link
          href={returnTo}
          onClick={(e) => {
            if (!statsDirty) return;
            if (!confirm("Há alterações não salvas nas temporadas. Deseja sair sem salvar?")) {
              e.preventDefault();
            }
          }}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] mb-2"
        >
          <ChevronLeft size={13} /> {returnLabel}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {isNew ? "Novo técnico" : manager!.name}
        </h1>
        {!isNew && (
          <p className="text-sm text-gray-500 mt-0.5">
            {[manager!.nationality, periodLabel].filter(Boolean).join(" · ") ||
              "Sem nacionalidade"}
          </p>
        )}
        {savedMsg && <p className="text-sm text-green-700 mt-1">{savedMsg}</p>}
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.locked}
            title={t.locked ? "Salve o perfil primeiro" : undefined}
            onClick={() => {
              if (!t.locked) requestTabChange(t.id);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              t.locked
                ? "border-transparent text-gray-300 cursor-not-allowed"
                : tab === t.id
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

      {tab === "perfil" && (
        <ManagerProfileForm
          key={isNew ? "new" : manager!.id}
          initial={isNew ? undefined : manager!}
          isNew={isNew}
          onSave={saveManager}
          cancelHref={returnTo}
          onMerged={isNew ? undefined : handleMerged}
        />
      )}

      {tab === "temporadas" && !isNew && (
        <div className="bg-white border rounded-lg p-4 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                Estatísticas por temporada
              </h2>
              {manager?.statsSource && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Carreira: {manager.storedGames ?? 0}J · {manager.storedWins ?? 0}V ·{" "}
                  {manager.storedDraws ?? 0}E · {manager.storedLosses ?? 0}D
                  {manager.statsSource === "manual"
                    ? " (com linhas manuais)"
                    : manager.statsSource === "calculated"
                      ? " (calculado)"
                      : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={recalculating || statsDirty}
                title={statsDirty ? "Salve ou descarte alterações antes" : undefined}
                onClick={recalculate}
              >
                {recalculating ? "Recalculando…" : "Recalcular a partir das partidas"}
              </Button>
              <button
                type="button"
                onClick={() => setStatDialog(true)}
                className="text-xs text-[#1B3A6B] font-medium hover:underline flex items-center gap-1"
              >
                <Plus size={11} /> Adicionar temporada
              </button>
            </div>
          </div>

          {stats.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma temporada cadastrada</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[36rem]">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b">
                      <th className="text-left py-1.5">Temporada</th>
                      <th className="text-right py-1.5 w-16">J</th>
                      <th className="text-right py-1.5 w-16">V</th>
                      <th className="text-right py-1.5 w-16">E</th>
                      <th className="text-right py-1.5 w-16">D</th>
                      <th className="text-right py-1.5 w-16">GP</th>
                      <th className="text-right py-1.5 w-16">GC</th>
                      <th className="text-left py-1.5 pl-2">Origem</th>
                      <th className="py-1.5 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat) => {
                      const d = statDrafts[stat.id] ?? draftsFromStats([stat])[stat.id];
                      return (
                        <tr key={stat.id} className="border-b border-gray-100">
                          <td className="py-2 font-medium">{stat.season}</td>
                          {(
                            [
                              "games",
                              "wins",
                              "draws",
                              "losses",
                              "goalsFor",
                              "goalsAgainst",
                            ] as const
                          ).map((field) => (
                            <td key={field} className="py-1.5 text-right">
                              <Input
                                type="number"
                                min={0}
                                value={d[field]}
                                onChange={(e) =>
                                  updateDraft(stat.id, field, e.target.value)
                                }
                                className="h-8 w-[3.75rem] ml-auto text-right px-1.5"
                              />
                            </td>
                          ))}
                          <td className="py-2 pl-2 text-xs text-gray-500 whitespace-nowrap">
                            {sourceLabel(stat.statsSource, stat.statsRecalculatedAt)}
                          </td>
                          <td className="py-2">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => deleteStat(stat.id)}
                                className="p-0.5 text-gray-400 hover:text-red-600"
                                title="Excluir temporada"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-gray-200">
                      <td className="py-2 font-semibold text-gray-800">Total</td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {draftTotals.games}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {draftTotals.wins}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {draftTotals.draws}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {draftTotals.losses}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {draftTotals.goalsFor}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {draftTotals.goalsAgainst}
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              {statsDirty && (
                <p className="text-xs text-amber-700 mt-2">Alterações não salvas</p>
              )}
              {statsError && <p className="text-sm text-red-600 mt-2">{statsError}</p>}
              {statsSavedMsg && (
                <p className="text-sm text-green-700 mt-2">{statsSavedMsg}</p>
              )}

              <div className="mt-3">
                <Button
                  type="button"
                  className="bg-[#1B3A6B]"
                  disabled={!statsDirty || savingStats}
                  onClick={saveStatsBulk}
                >
                  {savingStats ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "badges" && !isNew && (
        <div className="bg-white border rounded-lg p-4 max-w-2xl">
          <AdminEntityBadges entityType="manager" entityId={managerId} />
        </div>
      )}

      <Dialog open={statDialog} onOpenChange={setStatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Temporada</DialogTitle>
          </DialogHeader>
          {statDialog && (
            <SeasonStatForm
              onSave={addStat}
              onCancel={() => setStatDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
