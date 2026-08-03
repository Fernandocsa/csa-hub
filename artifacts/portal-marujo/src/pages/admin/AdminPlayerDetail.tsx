import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { useAdminReturnTo } from "@/hooks/useAdminReturnTo";
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
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { AdminNameDuplicateWarning } from "@/components/AdminNameDuplicateWarning";
import { PLAYER_POSITIONS } from "@/lib/position-groups";

export interface Player {
  id: number;
  name: string;
  fullName: string | null;
  position: string | null;
  secondaryPositions: string[];
  nationality: string | null;
  photoUrl: string | null;
  birthYear: number | null;
  birthDate: string | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;
  preferredFoot: string | null;
  heightCm: number | null;
  weightKg: number | null;
  isDeceased: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  linkedManagerId?: number | null;
  linkedManagerName?: string | null;
}

interface StatRow {
  id: number;
  playerId: number;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
}

type PlayerPayload = Omit<Player, "id" | "linkedManagerName">;

type BirthMode = "exact" | "year";

type TabId = "perfil" | "temporadas" | "badges";

const FEET = [
  { value: "destro", label: "Destro" },
  { value: "canhoto", label: "Canhoto" },
  { value: "ambidestro", label: "Ambidestro" },
];

function positionOptions(current?: string | null): string[] {
  if (current && !PLAYER_POSITIONS.includes(current as (typeof PLAYER_POSITIONS)[number])) {
    return [current, ...PLAYER_POSITIONS];
  }
  return [...PLAYER_POSITIONS];
}

function PlayerProfileForm({
  initial,
  onSave,
  onDelete,
  isNew,
  cancelHref = "/admin/jogadores",
}: {
  initial?: Partial<Player>;
  onSave: (data: PlayerPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
  isNew: boolean;
  cancelHref?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>(
    initial?.secondaryPositions ?? [],
  );
  const [birthYear, setBirthYear] = useState(String(initial?.birthYear ?? ""));
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [birthMode, setBirthMode] = useState<BirthMode>(
    initial?.birthDate ? "exact" : initial?.birthYear != null ? "year" : "exact",
  );
  const [birthCity, setBirthCity] = useState(initial?.birthCity ?? "");
  const [birthState, setBirthState] = useState(initial?.birthState ?? "");
  const [birthCountry, setBirthCountry] = useState(
    initial?.birthCountry?.trim() ||
      initial?.nationality?.trim() ||
      (isNew ? "Brasil" : ""),
  );
  const [preferredFoot, setPreferredFoot] = useState(initial?.preferredFoot ?? "");
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm != null ? String(initial.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    initial?.weightKg != null ? String(initial.weightKg) : "",
  );
  const [isDeceased, setIsDeceased] = useState(initial?.isDeceased ?? false);
  const [isVerified, setIsVerified] = useState(initial?.verificationStatus === "verified");
  const [verifiedBy, setVerifiedBy] = useState(initial?.verifiedBy ?? "");
  const [linkedManagerId, setLinkedManagerId] = useState(
    initial?.linkedManagerId != null ? String(initial.linkedManagerId) : "",
  );
  const [managerSearch, setManagerSearch] = useState("");
  const [managerOptions, setManagerOptions] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameBlocked, setNameBlocked] = useState(false);

  useEffect(() => {
    setName(initial?.name ?? "");
    setFullName(initial?.fullName ?? "");
    setPhotoUrl(initial?.photoUrl ?? "");
    setPosition(initial?.position ?? "");
    setSecondaryPositions(initial?.secondaryPositions ?? []);
    setBirthYear(String(initial?.birthYear ?? ""));
    setBirthDate(initial?.birthDate ?? "");
    setBirthMode(initial?.birthDate ? "exact" : initial?.birthYear != null ? "year" : "exact");
    setBirthCity(initial?.birthCity ?? "");
    setBirthState(initial?.birthState ?? "");
    setBirthCountry(
      initial?.birthCountry?.trim() ||
        initial?.nationality?.trim() ||
        (isNew ? "Brasil" : ""),
    );
    setPreferredFoot(initial?.preferredFoot ?? "");
    setHeightCm(initial?.heightCm != null ? String(initial.heightCm) : "");
    setWeightKg(initial?.weightKg != null ? String(initial.weightKg) : "");
    setIsDeceased(initial?.isDeceased ?? false);
    setIsVerified(initial?.verificationStatus === "verified");
    setVerifiedBy(initial?.verifiedBy ?? "");
    setLinkedManagerId(
      initial?.linkedManagerId != null ? String(initial.linkedManagerId) : "",
    );
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await adminFetch("/admin/managers");
      if (!r.ok || cancelled) return;
      const rows = (await r.json()) as { id: number; name: string }[];
      if (!cancelled) setManagerOptions(rows.map((m) => ({ id: m.id, name: m.name })));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredManagers = useMemo(() => {
    const q = managerSearch.trim().toLowerCase();
    if (!q) return managerOptions.slice(0, 30);
    return managerOptions
      .filter((m) => m.name.toLowerCase().includes(q) || String(m.id) === q)
      .slice(0, 30);
  }, [managerOptions, managerSearch]);

  const selectedManagerName =
    linkedManagerId &&
    (managerOptions.find((m) => String(m.id) === linkedManagerId)?.name ??
      initial?.linkedManagerName ??
      null);

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";
  const primaryOptions = positionOptions(position);
  const secondaryOptions = PLAYER_POSITIONS.filter((p) => p !== position);

  function toggleSecondary(pos: string) {
    setSecondaryPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nameBlocked) {
      setError("Já existe jogador com esse nome completo. Abra o perfil existente para editar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const normalizedBirthDate = birthMode === "exact" ? birthDate.trim() || null : null;
      const normalizedBirthYear =
        birthMode === "exact"
          ? normalizedBirthDate
            ? parseInt(normalizedBirthDate.slice(0, 4), 10)
            : null
          : birthYear
            ? parseInt(birthYear, 10)
            : null;
      await onSave({
        name,
        fullName: fullName.trim() || null,
        photoUrl: photoUrl.trim() || null,
        position: position || null,
        secondaryPositions: secondaryPositions.filter((p) => p && p !== position),
        nationality: birthCountry.trim() || null,
        birthYear: normalizedBirthYear,
        birthDate: normalizedBirthDate,
        birthCity: birthCity.trim() || null,
        birthState: birthState.trim() || null,
        birthCountry: birthCountry.trim() || null,
        preferredFoot: preferredFoot || null,
        heightCm: heightCm ? parseInt(heightCm) : null,
        weightKg: weightKg ? parseInt(weightKg) : null,
        isDeceased,
        verificationStatus: isVerified ? "verified" : "unverified",
        verifiedAt: null,
        verifiedBy: isVerified ? verifiedBy.trim() || null : null,
        linkedManagerId: linkedManagerId.trim()
          ? parseInt(linkedManagerId.trim(), 10)
          : null,
      });
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Excluir este jogador e todas as suas estatísticas?")) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err: any) {
      setError(err.message ?? "Erro ao excluir");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-2xl">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Foto de perfil
        </label>
        <div className="flex items-start gap-3">
          <PlayerPhoto url={photoUrl.trim() || null} name={name || "Jogador"} size="md" />
          <div className="flex-1 min-w-0">
            <Input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://… ou /players/192.jpg"
            />
            <p className="text-xs text-gray-400 mt-1">
              URL HTTPS ou caminho local em public (ex.: /players/id.jpg). Sem upload nesta tela.
            </p>
          </div>
        </div>
      </div>
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
      <AdminNameDuplicateWarning
        kind="player"
        name={name}
        fullName={fullName}
        excludeId={initial?.id ?? null}
        hrefForId={(id) => `/admin/jogadores/${id}`}
        onBlockChange={setNameBlocked}
      />
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Posição principal
        </label>
        <select
          className={sel}
          value={position}
          onChange={(e) => {
            const next = e.target.value;
            setPosition(next);
            setSecondaryPositions((prev) => prev.filter((p) => p !== next));
          }}
        >
          <option value="">–</option>
          {primaryOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Posições secundárias
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Só informativas — não afetam a ordem da escalação.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded border p-3 bg-gray-50">
          {secondaryOptions.map((p) => (
            <label key={p} className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={secondaryPositions.includes(p)}
                onChange={() => toggleSecondary(p)}
                className="rounded border-gray-300"
              />
              {p}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Nascimento
          </label>
          <select
            className={sel}
            value={birthMode}
            onChange={(e) => setBirthMode(e.target.value as BirthMode)}
          >
            <option value="exact">Sei a data exata</option>
            <option value="year">Só sei o ano aproximado</option>
          </select>
        </div>
        <div>
          {birthMode === "exact" ? (
            <>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Data de nascimento
              </label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </>
          ) : (
            <>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Ano de nascimento
              </label>
              <Input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="1990"
                min={1850}
                max={2100}
              />
            </>
          )}
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
            País / Nacionalidade
          </label>
          <Input
            value={birthCountry}
            onChange={(e) => setBirthCountry(e.target.value)}
            placeholder="Brasil"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
              className="rounded border-gray-300"
            />
            Falecido
          </label>
        </div>
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
          Vínculo com técnico (ex-jogador → técnico)
        </label>
        <Input
          value={managerSearch}
          onChange={(e) => setManagerSearch(e.target.value)}
          placeholder="Buscar técnico por nome ou ID…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={linkedManagerId}
            onChange={(e) => setLinkedManagerId(e.target.value)}
            placeholder="ID do técnico"
            className="w-32"
          />
          {selectedManagerName ? (
            <span className="text-sm text-gray-700">
              Selecionado: <strong>{selectedManagerName}</strong>
            </span>
          ) : (
            <span className="text-xs text-gray-400">Nenhum técnico vinculado</span>
          )}
          {linkedManagerId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLinkedManagerId("")}
            >
              Limpar
            </Button>
          )}
        </div>
        {managerSearch.trim() && filteredManagers.length > 0 && (
          <ul className="max-h-40 overflow-y-auto border rounded bg-white text-sm divide-y">
            {filteredManagers.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 hover:bg-blue-50"
                  onClick={() => {
                    setLinkedManagerId(String(m.id));
                    setManagerSearch("");
                  }}
                >
                  #{m.id} — {m.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving || nameBlocked}>
          {saving ? "Salvando..." : isNew ? "Criar jogador" : "Salvar"}
        </Button>
        <Link href={cancelHref}>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
        {!isNew && onDelete && (
          <Button
            type="button"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 ml-auto"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Excluindo..." : "Excluir jogador"}
          </Button>
        )}
      </div>
    </form>
  );
}

function StatForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Omit<StatRow, "id" | "playerId">) => Promise<void>;
  onCancel: () => void;
}) {
  const [season, setSeason] = useState("");
  const [appearances, setAppearances] = useState("0");
  const [goals, setGoals] = useState("0");
  const [assists, setAssists] = useState("0");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        season,
        appearances: parseInt(appearances, 10) || 0,
        goals: parseInt(goals, 10) || 0,
        assists: parseInt(assists, 10) || 0,
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
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Partidas
          </label>
          <Input
            type="number"
            value={appearances}
            onChange={(e) => setAppearances(e.target.value)}
            min={0}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Gols</label>
          <Input
            type="number"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Assistências
          </label>
          <Input
            type="number"
            value={assists}
            onChange={(e) => setAssists(e.target.value)}
            min={0}
          />
        </div>
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

type StatDraft = {
  appearances: string;
  goals: string;
  assists: string;
};

function draftsFromStats(rows: StatRow[]): Record<number, StatDraft> {
  const next: Record<number, StatDraft> = {};
  for (const s of rows) {
    next[s.id] = {
      appearances: String(s.appearances ?? 0),
      goals: String(s.goals ?? 0),
      assists: String(s.assists ?? 0),
    };
  }
  return next;
}

export default function AdminPlayerDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { returnTo, label: returnLabel } = useAdminReturnTo("/admin/jogadores");
  const isNew = !params.id;
  const playerId = params.id ? Number(params.id) : NaN;

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState<TabId>("perfil");
  const [statDialog, setStatDialog] = useState(false);
  const [statDrafts, setStatDrafts] = useState<Record<number, StatDraft>>({});
  const [savingStats, setSavingStats] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsSavedMsg, setStatsSavedMsg] = useState("");

  const loadPlayer = useCallback(async () => {
    if (isNew || !playerId || Number.isNaN(playerId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/players/${playerId}`);
    if (!r.ok) {
      setError("Jogador não encontrado");
      setPlayer(null);
      setLoading(false);
      return;
    }
    setPlayer(await r.json());
    setLoading(false);
  }, [isNew, playerId]);

  const loadStats = useCallback(async () => {
    if (isNew || !playerId || Number.isNaN(playerId)) return;
    const r = await adminFetch(`/admin/players/${playerId}/stats`);
    if (r.ok) {
      const rows = (await r.json()) as StatRow[];
      setStats(rows);
      setStatDrafts(draftsFromStats(rows));
    }
  }, [isNew, playerId]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  useEffect(() => {
    if (!isNew) loadStats();
  }, [isNew, loadStats]);

  const dirtyStats = useMemo(() => {
    return stats.filter((s) => {
      const d = statDrafts[s.id];
      if (!d) return false;
      const appearances = parseInt(d.appearances, 10) || 0;
      const goals = parseInt(d.goals, 10) || 0;
      const assists = parseInt(d.assists, 10) || 0;
      return (
        appearances !== s.appearances ||
        goals !== s.goals ||
        assists !== s.assists
      );
    });
  }, [stats, statDrafts]);

  const statsDirty = dirtyStats.length > 0;

  const draftTotals = useMemo(() => {
    let appearances = 0;
    let goals = 0;
    let assists = 0;
    for (const s of stats) {
      const d = statDrafts[s.id];
      appearances += parseInt(d?.appearances ?? String(s.appearances), 10) || 0;
      goals += parseInt(d?.goals ?? String(s.goals), 10) || 0;
      assists += parseInt(d?.assists ?? String(s.assists), 10) || 0;
    }
    return { appearances, goals, assists };
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

  async function savePlayer(data: PlayerPayload) {
    const r = await adminFetch(
      isNew ? "/admin/players" : `/admin/players/${playerId}`,
      { method: isNew ? "POST" : "PUT", body: JSON.stringify(data) },
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro");
    }
    const saved = (await r.json()) as Player;
    if (isNew) {
      setLocation(`/admin/jogadores/${saved.id}`);
      return;
    }
    setPlayer(saved);
    setSavedMsg("Perfil salvo.");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  async function deletePlayer() {
    if (statsDirty) {
      if (!confirm("Há alterações não salvas nas temporadas. Continuar e excluir o jogador?")) {
        return;
      }
    }
    const r = await adminFetch(`/admin/players/${playerId}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro ao excluir");
    }
    setLocation(returnTo);
  }

  async function addStat(data: Omit<StatRow, "id" | "playerId">) {
    const r = await adminFetch(`/admin/players/${playerId}/stats`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro");
    }
    setStatDialog(false);
    await loadStats();
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
          appearances: parseInt(d.appearances, 10) || 0,
          goals: parseInt(d.goals, 10) || 0,
          assists: parseInt(d.assists, 10) || 0,
        };
      });
      const r = await adminFetch(`/admin/players/${playerId}/stats/bulk`, {
        method: "PUT",
        body: JSON.stringify({ stats: payload }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      await loadStats();
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
          "Há alterações não salvas. Excluir esta temporada descarta as mudanças dessa linha no servidor; as outras edições continuam no formulário. Continuar?",
        )
      ) {
        return;
      }
    }
    if (!confirm("Excluir esta temporada?")) return;
    await adminFetch(`/admin/player-stats/${statId}`, { method: "DELETE" });
    await loadStats();
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

  if (!isNew && (error || !player)) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "Jogador não encontrado"}</p>
        <Link
          href={returnTo}
          className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block"
        >
          Voltar
        </Link>
      </div>
    );
  }

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
          {isNew ? "Novo jogador" : player!.name}
        </h1>
        {!isNew && (
          <p className="text-sm text-gray-500 mt-0.5">
            {[player!.position, player!.nationality].filter(Boolean).join(" · ") || "Sem posição"}
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
        <PlayerProfileForm
          key={isNew ? "new" : player!.id}
          initial={isNew ? undefined : player!}
          isNew={isNew}
          onSave={savePlayer}
          onDelete={isNew ? undefined : deletePlayer}
          cancelHref={returnTo}
        />
      )}

      {tab === "temporadas" && !isNew && (
        <div className="bg-white border rounded-lg p-4 max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Estatísticas por temporada</h2>
            <button
              type="button"
              onClick={() => setStatDialog(true)}
              className="text-xs text-[#1B3A6B] font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={11} /> Adicionar temporada
            </button>
          </div>
          {stats.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma temporada cadastrada</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b">
                    <th className="text-left py-1.5">Temporada</th>
                    <th className="text-right py-1.5 w-24">Partidas</th>
                    <th className="text-right py-1.5 w-24">Gols</th>
                    <th className="text-right py-1.5 w-24">Assist.</th>
                    <th className="py-1.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => {
                    const d = statDrafts[stat.id] ?? {
                      appearances: String(stat.appearances),
                      goals: String(stat.goals),
                      assists: String(stat.assists),
                    };
                    return (
                      <tr key={stat.id} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{stat.season}</td>
                        <td className="py-1.5 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={d.appearances}
                            onChange={(e) =>
                              updateDraft(stat.id, "appearances", e.target.value)
                            }
                            className="h-8 w-[4.25rem] ml-auto text-right px-2"
                          />
                        </td>
                        <td className="py-1.5 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={d.goals}
                            onChange={(e) => updateDraft(stat.id, "goals", e.target.value)}
                            className="h-8 w-[4.25rem] ml-auto text-right px-2"
                          />
                        </td>
                        <td className="py-1.5 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={d.assists}
                            onChange={(e) => updateDraft(stat.id, "assists", e.target.value)}
                            className="h-8 w-[4.25rem] ml-auto text-right px-2"
                          />
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
                      {draftTotals.appearances}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {draftTotals.goals}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {draftTotals.assists}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>

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
          <AdminEntityBadges entityType="player" entityId={playerId} />
        </div>
      )}

      <Dialog open={statDialog} onOpenChange={setStatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Temporada</DialogTitle>
          </DialogHeader>
          {statDialog && (
            <StatForm onSave={addStat} onCancel={() => setStatDialog(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
