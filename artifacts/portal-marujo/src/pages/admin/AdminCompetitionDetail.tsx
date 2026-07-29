import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";

export const COMPETITION_TYPE_LABELS: Record<string, string> = {
  state: "Estadual",
  league: "Nacional",
  regional: "Regional",
  cup: "Copa",
  friendly: "Amistoso",
};

export const COMPETITION_TYPES = [
  "state",
  "league",
  "regional",
  "cup",
  "friendly",
] as const;

export type Competition = {
  id: number;
  name: string;
  type: string | null;
  matchCount?: number;
};

type CompetitionMatch = {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  opponentName: string;
  phase: string | null;
  round: string | null;
};

type CompetitionSeason = {
  season: string;
  matchCount: number;
};

type CompetitionListItem = Competition & { matchCount: number };

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function AdminCompetitionDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo" || !params.id;
  const competitionId = isNew ? NaN : Number(params.id);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [seasons, setSeasons] = useState<CompetitionSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [seasonMatches, setSeasonMatches] = useState<CompetitionMatch[]>([]);
  const [loadingSeasonMatches, setLoadingSeasonMatches] = useState(false);
  const [allCompetitions, setAllCompetitions] = useState<CompetitionListItem[]>([]);
  const [mergeRemoveId, setMergeRemoveId] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (isNew || Number.isNaN(competitionId)) return;
    setLoading(true);
    setError("");
    setSelectedSeason(null);
    setSeasonMatches([]);
    const [detailRes, listRes] = await Promise.all([
      adminFetch(`/admin/competitions/${competitionId}`),
      adminFetch("/admin/competitions"),
    ]);
    if (!detailRes.ok) {
      setError("Competição não encontrada");
      setLoading(false);
      return;
    }
    const data = (await detailRes.json()) as Competition & {
      matchCount?: number;
      seasons?: CompetitionSeason[];
    };
    setName(data.name);
    setType(data.type ?? "");
    setMatchCount(data.matchCount ?? 0);
    setSeasons(Array.isArray(data.seasons) ? data.seasons : []);
    if (listRes.ok) {
      setAllCompetitions((await listRes.json()) as CompetitionListItem[]);
    }
    setLoading(false);
  }, [isNew, competitionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function openSeason(season: string) {
    if (Number.isNaN(competitionId)) return;
    setSelectedSeason(season);
    setLoadingSeasonMatches(true);
    setError("");
    const r = await adminFetch(
      `/admin/competitions/${competitionId}/matches?season=${encodeURIComponent(season)}`,
    );
    if (!r.ok) {
      setError("Erro ao carregar partidas da temporada");
      setSeasonMatches([]);
    } else {
      const data = (await r.json()) as { matches?: CompetitionMatch[] };
      setSeasonMatches(Array.isArray(data.matches) ? data.matches : []);
    }
    setLoadingSeasonMatches(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        type: type.trim() || null,
      };
      const r = await adminFetch(
        isNew ? "/admin/competitions" : `/admin/competitions/${competitionId}`,
        {
          method: isNew ? "POST" : "PUT",
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      const payload = await r.json();
      const saved = (isNew ? payload : payload.competition) as Competition;
      if (isNew) setLocation(`/admin/competicoes/${saved.id}`);
      else {
        setName(saved.name);
        setType(saved.type ?? "");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (matchCount > 0) {
      setError(
        `Não é possível excluir: há ${matchCount} partida(s) vinculada(s). Use Mesclar se for duplicata.`,
      );
      return;
    }
    if (!confirm("Excluir esta competição?")) return;
    const r = await adminFetch(`/admin/competitions/${competitionId}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    setLocation("/admin/competicoes");
  }

  async function handleMerge() {
    const removeId = Number(mergeRemoveId);
    if (!removeId || Number.isNaN(removeId)) {
      setError("Selecione a competição a absorver");
      return;
    }
    const other = allCompetitions.find((c) => c.id === removeId);
    if (
      !confirm(
        `Mesclar "${other?.name ?? removeId}" nesta competição?\n\nTodas as partidas de "${other?.name}" passarão para "${name}", e a competição absorvida será excluída.`,
      )
    ) {
      return;
    }
    setMerging(true);
    setError("");
    const r = await adminFetch("/admin/competitions/merge", {
      method: "POST",
      body: JSON.stringify({ keepId: competitionId, removeId }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao mesclar");
      setMerging(false);
      return;
    }
    setMergeRemoveId("");
    setMerging(false);
    await load();
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && error && !name) {
    return (
      <div>
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/admin/competicoes"
          className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block"
        >
          Voltar às competições
        </Link>
      </div>
    );
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";
  const mergeCandidates = allCompetitions.filter((c) => c.id !== competitionId);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/competicoes"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={13} className="mr-0.5" /> Competições
      </Link>

      <h1 className="text-xl font-bold text-gray-900">
        {isNew ? "Nova competição" : name}
      </h1>

      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Nome *
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Nível
          </label>
          <select
            className={sel}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">— sem nível —</option>
            {COMPETITION_TYPES.map((t) => (
              <option key={t} value={t}>
                {COMPETITION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Aparece como “Nível” na listagem pública de competições.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
            {saving ? "Salvando..." : isNew ? "Criar competição" : "Salvar"}
          </Button>
          <Link href="/admin/competicoes">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          {!isNew && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={matchCount > 0}
              title={
                matchCount > 0
                  ? "Possui partidas — use Mesclar"
                  : "Excluir"
              }
            >
              Excluir
            </Button>
          )}
        </div>
      </form>

      {!isNew && (
        <section className="space-y-3 max-w-xl border rounded-lg bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Mesclar duplicata
          </h2>
          <p className="text-sm text-gray-500">
            Absorve outra competição nesta: as partidas migram para cá e a outra
            é excluída.
          </p>
          <select
            className={sel}
            value={mergeRemoveId}
            onChange={(e) => setMergeRemoveId(e.target.value)}
          >
            <option value="">— escolher competição a absorver —</option>
            {mergeCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.type ? ` (${COMPETITION_TYPE_LABELS[c.type] ?? c.type})` : ""}
                {` · ${c.matchCount} partidas`}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            disabled={!mergeRemoveId || merging}
            onClick={handleMerge}
          >
            {merging ? "Mesclando..." : "Mesclar nesta"}
          </Button>
        </section>
      )}

      {!isNew && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {selectedSeason
                ? `Partidas · ${selectedSeason}`
                : `Temporadas (${seasons.length})`}
            </h2>
            {selectedSeason && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSeason(null);
                  setSeasonMatches([]);
                }}
                className="text-xs text-[#1B3A6B] hover:underline"
              >
                ← Todas as temporadas
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {matchCount} partida{matchCount === 1 ? "" : "s"} no total
          </p>

          {!selectedSeason && seasons.length === 0 && (
            <p className="text-sm text-gray-400">
              Nenhuma partida vinculada a esta competição.
            </p>
          )}

          {!selectedSeason && seasons.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Temporada
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Partidas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((s) => (
                    <tr
                      key={s.season}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => void openSeason(s.season)}
                    >
                      <td className="px-3 py-2 font-medium text-[#1B3A6B]">
                        {s.season}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600 tabular-nums">
                        {s.matchCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSeason && loadingSeasonMatches && (
            <p className="text-sm text-gray-400">Carregando partidas...</p>
          )}

          {selectedSeason && !loadingSeasonMatches && seasonMatches.length === 0 && (
            <p className="text-sm text-gray-400">
              Nenhuma partida nesta temporada.
            </p>
          )}

          {selectedSeason && !loadingSeasonMatches && seasonMatches.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Adversário
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Placar
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Local
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seasonMatches.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/admin/partidas/${m.id}`}
                          className="text-[#1B3A6B] hover:underline font-medium"
                        >
                          {fmtDate(m.matchDate)}
                        </Link>
                        {(m.phase || m.round) && (
                          <span className="block text-[10px] text-gray-400">
                            {[m.phase, m.round].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/partidas/${m.id}`}
                          className="hover:text-[#1B3A6B] hover:underline"
                        >
                          {m.opponentName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        {m.goalsFor ?? "–"}–{m.goalsAgainst ?? "–"}
                        <span className="ml-2 text-xs text-gray-400 uppercase">
                          {m.result}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.homeAway === "home"
                          ? "Casa"
                          : m.homeAway === "away"
                            ? "Fora"
                            : m.homeAway}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
