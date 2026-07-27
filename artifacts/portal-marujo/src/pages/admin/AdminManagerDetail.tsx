import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { AdminEntityBadges } from "@/components/AdminEntityBadges";

export interface Manager {
  id: number;
  name: string;
  nationality: string | null;
  startYear: number | null;
  endYear: number | null;
  seasons: string | null;
  storedGames: number | null;
  storedWins: number | null;
  storedDraws: number | null;
  storedLosses: number | null;
  storedGoalsFor: number | null;
  storedGoalsAgainst: number | null;
  statsSource: "manual" | "calculated" | null;
  statsRecalculatedAt: string | null;
}

type ManagerPayload = Omit<Manager, "id" | "statsSource" | "statsRecalculatedAt">;

type TabId = "perfil" | "badges";

function numOrNull(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

function StatsSourceLabel({
  source,
  recalculatedAt,
}: {
  source: Manager["statsSource"];
  recalculatedAt: string | null;
}) {
  if (source === "calculated" && recalculatedAt) {
    return (
      <p className="text-xs text-green-700">
        Calculado em {new Date(recalculatedAt).toLocaleString("pt-BR")}
      </p>
    );
  }
  if (source === "manual") {
    return <p className="text-xs text-amber-700">Editado manualmente</p>;
  }
  return <p className="text-xs text-gray-400">Origem não definida</p>;
}

function ManagerProfileForm({
  initial,
  onSave,
  onRecalculate,
  isNew,
  recalculating,
}: {
  initial?: Partial<Manager>;
  onSave: (data: ManagerPayload) => Promise<void>;
  onRecalculate?: () => Promise<void>;
  isNew: boolean;
  recalculating?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nationality, setNationality] = useState(initial?.nationality ?? "Brasileiro");
  const [startYear, setStartYear] = useState(
    initial?.startYear != null ? String(initial.startYear) : "",
  );
  const [endYear, setEndYear] = useState(
    initial?.endYear != null ? String(initial.endYear) : "",
  );
  const [seasons, setSeasons] = useState(initial?.seasons ?? "");
  const [storedGames, setStoredGames] = useState(
    initial?.storedGames != null ? String(initial.storedGames) : "",
  );
  const [storedWins, setStoredWins] = useState(
    initial?.storedWins != null ? String(initial.storedWins) : "",
  );
  const [storedDraws, setStoredDraws] = useState(
    initial?.storedDraws != null ? String(initial.storedDraws) : "",
  );
  const [storedLosses, setStoredLosses] = useState(
    initial?.storedLosses != null ? String(initial.storedLosses) : "",
  );
  const [storedGoalsFor, setStoredGoalsFor] = useState(
    initial?.storedGoalsFor != null ? String(initial.storedGoalsFor) : "",
  );
  const [storedGoalsAgainst, setStoredGoalsAgainst] = useState(
    initial?.storedGoalsAgainst != null ? String(initial.storedGoalsAgainst) : "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initial?.name ?? "");
    setNationality(initial?.nationality ?? "Brasileiro");
    setStartYear(initial?.startYear != null ? String(initial.startYear) : "");
    setEndYear(initial?.endYear != null ? String(initial.endYear) : "");
    setSeasons(initial?.seasons ?? "");
    setStoredGames(initial?.storedGames != null ? String(initial.storedGames) : "");
    setStoredWins(initial?.storedWins != null ? String(initial.storedWins) : "");
    setStoredDraws(initial?.storedDraws != null ? String(initial.storedDraws) : "");
    setStoredLosses(initial?.storedLosses != null ? String(initial.storedLosses) : "");
    setStoredGoalsFor(initial?.storedGoalsFor != null ? String(initial.storedGoalsFor) : "");
    setStoredGoalsAgainst(
      initial?.storedGoalsAgainst != null ? String(initial.storedGoalsAgainst) : "",
    );
  }, [initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        name,
        nationality: nationality.trim() || null,
        startYear: numOrNull(startYear),
        endYear: numOrNull(endYear),
        seasons: seasons.trim() || null,
        storedGames: numOrNull(storedGames),
        storedWins: numOrNull(storedWins),
        storedDraws: numOrNull(storedDraws),
        storedLosses: numOrNull(storedLosses),
        storedGoalsFor: numOrNull(storedGoalsFor),
        storedGoalsAgainst: numOrNull(storedGoalsAgainst),
      });
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-2xl">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nome *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Ano início
          </label>
          <Input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="2018"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Ano fim
          </label>
          <Input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            placeholder="2024"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Temporadas
        </label>
        <Input
          value={seasons}
          onChange={(e) => setSeasons(e.target.value)}
          placeholder="2018,2019,2024"
        />
        <p className="text-xs text-gray-400 mt-1">Anos separados por vírgula (texto livre).</p>
      </div>

      <div className="pt-2 border-t">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Números (agregados)
            </h3>
            {!isNew && (
              <StatsSourceLabel
                source={initial?.statsSource ?? null}
                recalculatedAt={initial?.statsRecalculatedAt ?? null}
              />
            )}
          </div>
          {!isNew && onRecalculate && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={recalculating}
              onClick={() => onRecalculate()}
            >
              {recalculating ? "Recalculando..." : "Recalcular a partir das partidas"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Jogos
            </label>
            <Input
              type="number"
              value={storedGames}
              onChange={(e) => setStoredGames(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Vitórias
            </label>
            <Input
              type="number"
              value={storedWins}
              onChange={(e) => setStoredWins(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Empates
            </label>
            <Input
              type="number"
              value={storedDraws}
              onChange={(e) => setStoredDraws(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Derrotas
            </label>
            <Input
              type="number"
              value={storedLosses}
              onChange={(e) => setStoredLosses(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Gols pró
            </label>
            <Input
              type="number"
              value={storedGoalsFor}
              onChange={(e) => setStoredGoalsFor(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Gols contra
            </label>
            <Input
              type="number"
              value={storedGoalsAgainst}
              onChange={(e) => setStoredGoalsAgainst(e.target.value)}
              min={0}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
          {saving ? "Salvando..." : isNew ? "Criar técnico" : "Salvar"}
        </Button>
        <Link href="/admin/tecnicos">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}

export default function AdminManagerDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = !params.id;
  const managerId = params.id ? Number(params.id) : NaN;

  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [tab, setTab] = useState<TabId>("perfil");

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

  useEffect(() => {
    loadManager();
  }, [loadManager]);

  async function saveManager(data: ManagerPayload) {
    const r = await adminFetch(
      isNew ? "/admin/managers" : `/admin/managers/${managerId}`,
      { method: isNew ? "POST" : "PUT", body: JSON.stringify(data) },
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as any).error ?? "Erro");
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

  async function recalculateStats() {
    setRecalculating(true);
    setSavedMsg("");
    setError("");
    const r = await adminFetch(`/admin/managers/${managerId}/recalculate-stats`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao recalcular");
      setRecalculating(false);
      return;
    }
    const d = data as { manager: Manager; matchCount?: number };
    setManager(d.manager);
    setSavedMsg(
      `Recalculado a partir de ${d.matchCount ?? 0} partida(s). Valores salvos.`,
    );
    setTimeout(() => setSavedMsg(""), 4000);
    setRecalculating(false);
  }

  const tabs: { id: TabId; label: string; locked?: boolean }[] = [
    { id: "perfil", label: "Perfil" },
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
          href="/admin/tecnicos"
          className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block"
        >
          Voltar aos técnicos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      <div>
        <Link
          href="/admin/tecnicos"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] mb-2"
        >
          <ChevronLeft size={13} /> Técnicos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {isNew ? "Novo técnico" : manager!.name}
        </h1>
        {!isNew && (
          <p className="text-sm text-gray-500 mt-0.5">
            {manager!.nationality ?? "Sem nacionalidade"}
            {manager!.startYear != null || manager!.endYear != null
              ? ` · ${manager!.startYear ?? "?"}–${manager!.endYear ?? "?"}`
              : ""}
          </p>
        )}
        {savedMsg && <p className="text-sm text-green-700 mt-1">{savedMsg}</p>}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.locked}
            title={t.locked ? "Salve o perfil primeiro" : undefined}
            onClick={() => {
              if (!t.locked) setTab(t.id);
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
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <ManagerProfileForm
          key={isNew ? "new" : `${manager!.id}-${manager!.statsRecalculatedAt ?? ""}-${manager!.statsSource ?? ""}`}
          initial={isNew ? undefined : manager!}
          isNew={isNew}
          onSave={saveManager}
          onRecalculate={isNew ? undefined : recalculateStats}
          recalculating={recalculating}
        />
      )}

      {tab === "badges" && !isNew && (
        <div className="bg-white border rounded-lg p-4 max-w-2xl">
          <AdminEntityBadges entityType="manager" entityId={managerId} />
        </div>
      )}
    </div>
  );
}
